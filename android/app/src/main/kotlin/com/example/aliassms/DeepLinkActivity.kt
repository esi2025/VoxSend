package com.example.aliassms

import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.biometric.BiometricManager
import androidx.biometric.BiometricPrompt
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import com.example.aliassms.data.AppDatabase
import com.example.aliassms.data.SmsLog
import com.example.aliassms.utils.SmsSender
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import androidx.room.Room

class DeepLinkActivity : ComponentActivity() {

    private lateinit var db: AppDatabase

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        db = Room.databaseBuilder(applicationContext, AppDatabase::class.java, "alias-db").build()

        val alias = intent.data?.getQueryParameter("alias")?.trim()?.removeSuffix(":")
        val text = intent.data?.getQueryParameter("text")

        if (alias != null && text != null) {
            checkAuthAndSend(alias, text)
        } else {
            finish()
        }
    }

    private fun checkAuthAndSend(alias: String, text: String) {
        val executor = ContextCompat.getMainExecutor(this)
        val biometricPrompt = BiometricPrompt(this, executor,
            object : BiometricPrompt.AuthenticationCallback() {
                override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
                    super.onAuthenticationSucceeded(result)
                    executeSmsFlow(alias, text)
                }

                override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
                    super.onAuthenticationError(errorCode, errString)
                    Toast.makeText(this@DeepLinkActivity, "Auth failed: $errString", Toast.LENGTH_SHORT).show()
                    finish()
                }
            })

        val promptInfo = BiometricPrompt.PromptInfo.Builder()
            .setTitle("Verify Identity")
            .setSubtitle("Authenticate to send SMS to $alias")
            .setAllowedAuthenticators(BiometricManager.Authenticators.BIOMETRIC_STRONG or BiometricManager.Authenticators.DEVICE_CREDENTIAL)
            .build()

        biometricPrompt.authenticate(promptInfo)
    }

    private fun executeSmsFlow(alias: String, text: String?) {
        lifecycleScope.launch {
            val entry = withContext(Dispatchers.IO) {
                db.aliasDao().getByAlias(alias)
            }

            if (entry != null) {
                // Use provided text from voice command, or fallback to predefinedMessage
                val messageContent = text ?: entry.predefinedMessage
                val fullMessage = (entry.defaultPrefix ?: "") + messageContent
                SmsSender.sendSms(this@DeepLinkActivity, entry.phoneNumber, fullMessage)
                
                withContext(Dispatchers.IO) {
                    db.smsLogDao().insert(SmsLog(
                        alias = entry.alias,
                        maskedPhone = SmsSender.maskPhone(entry.phoneNumber),
                        messagePreview = fullMessage.take(60),
                        status = "SENT"
                    ))
                }
                
                Toast.makeText(this@DeepLinkActivity, "Message sent to ${entry.alias}", Toast.LENGTH_LONG).show()
            } else {
                Toast.makeText(this@DeepLinkActivity, "Alias '$alias' not found", Toast.LENGTH_LONG).show()
            }
            finish()
        }
    }
}
