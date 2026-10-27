const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const Notification = require('../models/Notification');
const Wishlist = require('../models/Wishlist');

let isFirebaseInitialized = false;

// Initialize Firebase Admin SDK safely
try {
  const existingApps = admin?.apps || [];
  if (existingApps.length === 0) {
    let credential = null;

    // Option 1: File path to serviceAccountKey.json
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || 
      path.join(__dirname, '../config/firebaseServiceAccount.json');

    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      credential = admin.credential.cert(serviceAccount);
      console.log('[PushNotificationService] Loaded Firebase credentials from serviceAccount file.');
    } 
    // Option 2: JSON string in environment variable
    else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        credential = admin.credential.cert(serviceAccount);
        console.log('[PushNotificationService] Loaded Firebase credentials from FIREBASE_SERVICE_ACCOUNT env var.');
      } catch (e) {
        console.warn('[PushNotificationService] Failed to parse FIREBASE_SERVICE_ACCOUNT JSON:', e.message);
      }
    } 
    // Option 3: Individual env variables
    else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      credential = admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      });
      console.log('[PushNotificationService] Loaded Firebase credentials from individual env vars.');
    }

    if (credential) {
      admin.initializeApp({ credential });
      isFirebaseInitialized = true;
      console.log('✅ [PushNotificationService] Firebase Cloud Messaging (FCM) successfully initialized.');
    } else {
      console.log('ℹ️ [PushNotificationService] Firebase service account credentials not detected. Operating in simulated Push Mode (notifications saved in DB & displayed in-app).');
    }
  } else {
    isFirebaseInitialized = true;
  }
} catch (err) {
  console.warn('[PushNotificationService] Error initializing Firebase Admin:', err.message);
}

/**
 * Send notification to a specific user (saves to DB and sends native FCM push)
 */
const sendToUser = async (userId, { title, body, type = 'system', data = {} }) => {
  try {
    if (!userId) return null;

    // 1. Create in-app notification in MongoDB
    const notification = await Notification.create({
      user: userId,
      title,
      body,
      type,
      data: {
        orderId: data.orderId ? String(data.orderId) : '',
        productId: data.productId ? String(data.productId) : '',
        url: data.url ? String(data.url) : '',
        imageUrl: data.imageUrl ? String(data.imageUrl) : '',
        metadata: data
      }
    });

    // 2. Lookup user's FCM tokens
    const user = await User.findById(userId).select('fcmTokens name email');
    if (!user || !user.fcmTokens || user.fcmTokens.length === 0) {
      console.log(`[PushNotification] Saved in-app notification for user ${userId}. No native FCM tokens registered.`);
      return notification;
    }

    const tokens = user.fcmTokens.map(t => t.token).filter(Boolean);
    if (tokens.length === 0) return notification;

    // 3. Send via Firebase Admin if configured
    if (isFirebaseInitialized) {
      const messagePayload = {
        tokens,
        notification: {
          title,
          body
        },
        data: {
          notificationId: notification._id.toString(),
          type: String(type),
          url: data.url || '/',
          orderId: data.orderId ? String(data.orderId) : '',
          productId: data.productId ? String(data.productId) : ''
        },
        android: {
          priority: 'high',
          notification: {
            channelId: 'kirti_store_default',
            icon: 'ic_launcher',
            color: '#14213D',
            sound: 'default'
          }
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1
            }
          }
        }
      };

      const response = await admin.messaging().sendEachForMulticast(messagePayload);
      console.log(`[PushNotification] FCM Multicast sent: ${response.successCount} success, ${response.failureCount} failed.`);

      // Clean up invalid or stale tokens
      if (response.failureCount > 0) {
        const tokensToRemove = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            const errCode = resp.error?.code;
            if (
              errCode === 'messaging/invalid-registration-token' ||
              errCode === 'messaging/registration-token-not-registered'
            ) {
              tokensToRemove.push(tokens[idx]);
            }
          }
        });

        if (tokensToRemove.length > 0) {
          user.fcmTokens = user.fcmTokens.filter(t => !tokensToRemove.includes(t.token));
          await user.save().catch(() => {});
          console.log(`[PushNotification] Cleaned up ${tokensToRemove.length} stale FCM tokens.`);
        }
      }
    } else {
      console.log(`[PushNotification-Simulated] Would push to ${tokens.length} device(s) for user ${user.name || userId}: "${title}" - "${body}"`);
    }

    return notification;
  } catch (error) {
    console.error('[PushNotification] sendToUser error:', error);
    return null;
  }
};

/**
 * 1. Order Dispatched Notification
 */
const sendOrderDispatched = async (order) => {
  if (!order || !order.user) return null;

  const orderNum = order._id.toString().slice(-6).toUpperCase();
  const courierText = order.courier ? ` with ${order.courier}` : '';
  const awbText = order.trackingAwb ? ` (AWB: ${order.trackingAwb})` : '';

  return await sendToUser(order.user, {
    title: `🚚 Order #${orderNum} Dispatched!`,
    body: `Your kitchen appliance package is on its way${courierText}${awbText}. Tap to track live!`,
    type: 'order_dispatched',
    data: {
      orderId: order._id.toString(),
      url: `/track-order?orderId=${order._id}`
    }
  });
};

/**
 * 2. Order Out For Delivery Notification
 */
const sendOrderOutForDelivery = async (order) => {
  if (!order || !order.user) return null;

  const orderNum = order._id.toString().slice(-6).toUpperCase();
  const driverName = order.deliveryDriver?.name ? ` by ${order.deliveryDriver.name}` : '';

  return await sendToUser(order.user, {
    title: `🛵 Out for Delivery Today!`,
    body: `Order #${orderNum} is out for delivery${driverName}. Please keep your phone nearby.`,
    type: 'order_out_for_delivery',
    data: {
      orderId: order._id.toString(),
      url: `/track-order?orderId=${order._id}`
    }
  });
};

/**
 * 3. Order Delivered Notification (with instant warranty claim CTA)
 */
const sendOrderDelivered = async (order) => {
  if (!order || !order.user) return null;

  const orderNum = order._id.toString().slice(-6).toUpperCase();

  return await sendToUser(order.user, {
    title: `🎉 Order #${orderNum} Delivered!`,
    body: `Your Kirti appliance has arrived safely. Tap to activate your 2-Year Manufacturer Warranty now!`,
    type: 'order_delivered',
    data: {
      orderId: order._id.toString(),
      url: `/warranty`
    }
  });
};

/**
 * 4. Wishlist Restock Alert
 * Sends targeted notification when a product changes from 0 stock to > 0 stock
 */
const sendRestockAlert = async (product) => {
  try {
    if (!product || !product._id) return { notifiedCount: 0 };

    // Find all users who saved this product in their wishlist
    const wishlists = await Wishlist.find({ products: product._id }).select('user');
    if (!wishlists || wishlists.length === 0) {
      console.log(`[RestockAlert] Product "${product.name}" restocked, but not found in any customer wishlists.`);
      return { notifiedCount: 0 };
    }

    const title = `✨ Back in Stock: ${product.name}!`;
    const body = `Great news! An item on your wishlist is back in stock with limited quantity. Grab yours now!`;

    let count = 0;
    for (const wl of wishlists) {
      if (wl.user) {
        await sendToUser(wl.user, {
          title,
          body,
          type: 'restock_alert',
          data: {
            productId: product._id.toString(),
            url: `/product/${product._id}`,
            imageUrl: product.images?.[0] || ''
          }
        });
        count++;
      }
    }

    console.log(`[RestockAlert] Successfully sent restock notifications to ${count} interested customer(s) for "${product.name}".`);
    return { notifiedCount: count };
  } catch (error) {
    console.error('[RestockAlert] Error sending restock notifications:', error);
    return { notifiedCount: 0 };
  }
};

/**
 * 5. Flash Deal Broadcast
 * Broadcasts an exclusive flash deal to all customers
 */
const sendFlashDealBroadcast = async ({ title, body, productId = '', url = '/deals', discountPercent = 0, sendPush = true }) => {
  try {
    const finalTitle = title || `🔥 Exclusive Flash Deal Alert!`;
    const finalBody = body || `Save big on premium Kirti kitchen appliances! Limited time offer.`;
    const finalUrl = productId ? `/product/${productId}` : url;

    // Find all active customers
    const customers = await User.find({ role: 'customer', accountStatus: 'active' }).select('_id fcmTokens');
    if (!customers || customers.length === 0) {
      return { recipientCount: 0 };
    }

    // Collect all FCM tokens across all customers
    const allTokens = [];
    customers.forEach(cust => {
      if (cust.fcmTokens && cust.fcmTokens.length > 0) {
        cust.fcmTokens.forEach(t => {
          if (t.token) allTokens.push(t.token);
        });
      }
    });

    // Save in-app notification in DB for all customers (batch insert for performance)
    const notificationsToInsert = customers.map(cust => ({
      user: cust._id,
      title: finalTitle,
      body: finalBody,
      type: 'flash_deal',
      data: {
        productId: productId ? String(productId) : '',
        url: finalUrl,
        metadata: { discountPercent }
      },
      isRead: false
    }));

    await Notification.insertMany(notificationsToInsert, { ordered: false }).catch(() => {});

    // Send push via Firebase Admin if initialized and tokens exist
    if (isFirebaseInitialized && sendPush && allTokens.length > 0) {
      // Chunk tokens into batches of 500 (Firebase multicast limit)
      const batchSize = 500;
      for (let i = 0; i < allTokens.length; i += batchSize) {
        const batchTokens = allTokens.slice(i, i + batchSize);
        await admin.messaging().sendEachForMulticast({
          tokens: batchTokens,
          notification: {
            title: finalTitle,
            body: finalBody
          },
          data: {
            type: 'flash_deal',
            url: finalUrl,
            productId: productId ? String(productId) : ''
          },
          android: {
            priority: 'high',
            notification: {
              channelId: 'kirti_store_deals',
              icon: 'ic_launcher',
              color: '#FF9F1C',
              sound: 'default'
            }
          }
        }).catch(err => console.warn('[FlashDeal] Broadcast batch error:', err.message));
      }
      console.log(`[FlashDeal] Dispatched native push broadcast to ${allTokens.length} devices.`);
    } else {
      console.log(`[FlashDeal-Simulated] Recorded in-app flash deal for ${customers.length} customers (${allTokens.length} native devices).`);
    }

    return { recipientCount: customers.length, deviceCount: allTokens.length };
  } catch (error) {
    console.error('[FlashDeal] Error broadcasting flash deal:', error);
    return { recipientCount: 0, deviceCount: 0 };
  }
};

module.exports = {
  isFirebaseInitialized: () => isFirebaseInitialized,
  sendToUser,
  sendOrderDispatched,
  sendOrderOutForDelivery,
  sendOrderDelivered,
  sendRestockAlert,
  sendFlashDealBroadcast
};
