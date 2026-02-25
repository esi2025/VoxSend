package com.example.aliassms.utils

import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.telephony.SmsManager
import android.util.Log

object SmsSender {
    private const val TAG = "SmsSender"

    fun sendSms(context: Context, phoneNumber: String, message: String) {
        try {
            val smsManager = context.getSystemService(SmsManager::class.java)
            
            val sentIntent = PendingIntent.getBroadcast(
                context, 0, Intent("SMS_SENT"), PendingIntent.FLAG_IMMUTABLE
            )
            val deliveredIntent = PendingIntent.getBroadcast(
                context, 0, Intent("SMS_DELIVERED"), PendingIntent.FLAG_IMMUTABLE
            )

            if (message.length > 160) {
                val parts = smsManager.divideMessage(message)
                smsManager.sendMultipartTextMessage(phoneNumber, null, parts, null, null)
            } else {
                smsManager.sendTextMessage(phoneNumber, null, message, sentIntent, deliveredIntent)
            }
            Log.d(TAG, "SMS initiated to $phoneNumber")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to send SMS", e)
        }
    }

    fun maskPhone(phone: String): String {
        return if (phone.length >= 7) {
            phone.substring(0, 3) + "****" + phone.substring(phone.length - 3)
        } else {
            "****" + phone.takeLast(3)
        }
    }
}
