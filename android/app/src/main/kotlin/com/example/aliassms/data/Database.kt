package com.example.aliassms.data

import androidx.room.*
import kotlinx.coroutines.flow.Flow

@Entity(tableName = "aliases")
data class AliasEntry(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    @ColumnInfo(index = true) val alias: String,
    val phoneNumber: String,
    val predefinedMessage: String,
    val defaultPrefix: String? = null,
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis()
)

@Entity(tableName = "sms_logs")
data class SmsLog(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val timestamp: Long = System.currentTimeMillis(),
    val alias: String,
    val maskedPhone: String,
    val messagePreview: String,
    val status: String,
    val failureReason: String? = null
)

@Dao
interface AliasDao {
    @Query("SELECT * FROM aliases ORDER BY alias ASC")
    fun getAllAliases(): Flow<List<AliasEntry>>

    @Query("SELECT * FROM aliases WHERE LOWER(alias) = LOWER(:alias) LIMIT 1")
    suspend fun getByAlias(alias: String): AliasEntry?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(alias: AliasEntry)

    @Delete
    suspend fun delete(alias: AliasEntry)
}

@Dao
interface SmsLogDao {
    @Query("SELECT * FROM sms_logs ORDER BY timestamp DESC")
    fun getAllLogs(): Flow<List<SmsLog>>

    @Insert
    suspend fun insert(log: SmsLog)
}

@Database(entities = [AliasEntry::class, SmsLog::class], version = 1)
abstract class AppDatabase : RoomDatabase() {
    abstract fun aliasDao(): AliasDao
    abstract fun smsLogDao(): SmsLogDao
}
