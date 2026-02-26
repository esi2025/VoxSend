import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  MessageSquare, 
  History, 
  Settings, 
  Mic, 
  ShieldCheck, 
  Send, 
  Trash2, 
  Edit2,
  CheckCircle2,
  XCircle,
  Fingerprint,
  ArrowLeft,
  Search,
  Code
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, maskPhone, normalizeAlias } from './utils';
import { AliasEntry, SmsLog, SmsStatus } from './types';

// --- Components ---

const Button = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  className,
  disabled = false
}: { 
  children: React.ReactNode; 
  onClick?: () => void; 
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  className?: string;
  disabled?: boolean;
}) => {
  const variants = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md',
    secondary: 'bg-zinc-200 text-zinc-900 hover:bg-zinc-300',
    ghost: 'bg-transparent text-zinc-600 hover:bg-zinc-100',
    danger: 'bg-red-50 text-red-600 hover:bg-red-100'
  };

  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'px-4 py-2 rounded-2xl font-medium transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:active:scale-100',
        variants[variant],
        className
      )}
    >
      {children}
    </button>
  );
};

const Card = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn('bg-white rounded-3xl p-4 shadow-sm border border-zinc-100', className)}>
    {children}
  </div>
);

const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          className="bg-zinc-50 w-full max-w-md rounded-t-[32px] sm:rounded-[32px] overflow-hidden shadow-2xl"
        >
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-zinc-900">{title}</h2>
              <button onClick={onClose} className="p-2 hover:bg-zinc-200 rounded-full transition-colors">
                <XCircle className="w-6 h-6 text-zinc-400" />
              </button>
            </div>
            {children}
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

// --- Main App ---

export default function App() {
  const [activeTab, setActiveTab] = useState<'aliases' | 'logs' | 'source'>('aliases');
  const [aliases, setAliases] = useState<AliasEntry[]>([]);
  const [logs, setLogs] = useState<SmsLog[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [editingAlias, setEditingAlias] = useState<AliasEntry | null>(null);
  const [pendingSms, setPendingSms] = useState<{ alias: string; text: string } | null>(null);
  const [voiceCommand, setVoiceCommand] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Form state
  const [formAlias, setFormAlias] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formPrefix, setFormPrefix] = useState('');
  const [formMessage, setFormMessage] = useState('');
  const [shortCodeInput, setShortCodeInput] = useState('');

  useEffect(() => {
    const savedAliases = localStorage.getItem('aliases');
    const savedLogs = localStorage.getItem('logs');
    if (savedAliases) setAliases(JSON.parse(savedAliases));
    if (savedLogs) setLogs(JSON.parse(savedLogs));
  }, []);

  useEffect(() => {
    localStorage.setItem('aliases', JSON.stringify(aliases));
  }, [aliases]);

  useEffect(() => {
    localStorage.setItem('logs', JSON.stringify(logs));
  }, [logs]);

  const handleSaveAlias = () => {
    if (!formAlias || !formPhone || !formMessage) return;

    if (editingAlias) {
      setAliases(aliases.map(a => a.id === editingAlias.id ? {
        ...a,
        alias: formAlias,
        phoneNumber: formPhone,
        predefinedMessage: formMessage,
        defaultPrefix: formPrefix,
        updatedAt: Date.now()
      } : a));
    } else {
      const newAlias: AliasEntry = {
        id: Math.random().toString(36).substr(2, 9),
        alias: formAlias,
        phoneNumber: formPhone,
        predefinedMessage: formMessage,
        defaultPrefix: formPrefix,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      setAliases([...aliases, newAlias]);
    }
    
    resetForm();
    setIsAddModalOpen(false);
  };

  const resetForm = () => {
    setFormAlias('');
    setFormPhone('');
    setFormPrefix('');
    setFormMessage('');
    setEditingAlias(null);
  };

  const handleDeleteAlias = (id: string) => {
    setAliases(aliases.filter(a => a.id !== id));
  };

  const triggerSendFlow = (alias: AliasEntry, customText?: string) => {
    setPendingSms({ 
      alias: alias.alias, 
      text: customText || alias.predefinedMessage 
    });
    setIsAuthModalOpen(true);
  };

  const handleShortCodeSubmit = () => {
    const normalized = normalizeAlias(shortCodeInput);
    const found = aliases.find(a => normalizeAlias(a.alias) === normalized);
    if (found) {
      triggerSendFlow(found);
      setShortCodeInput('');
    } else {
      alert(`Short code "${shortCodeInput}" not found.`);
    }
  };

  const handleVoiceCommand = () => {
    // Regex to match "Send message to <ALIAS>: <TEXT>"
    const match = voiceCommand.match(/Send message to (.*?): (.*)/i);
    if (match) {
      const aliasName = normalizeAlias(match[1]);
      const text = match[2];
      
      const found = aliases.find(a => normalizeAlias(a.alias) === aliasName);
      if (found) {
        triggerSendFlow(found, text);
        setIsVoiceModalOpen(false);
      } else {
        alert(`Alias "${aliasName}" not found. Please add it first.`);
      }
    } else {
      alert('Invalid command format. Use: "Send message to <ALIAS>: <TEXT>"');
    }
    setVoiceCommand('');
  };

  const handleAuthSuccess = () => {
    if (!pendingSms) return;

    const found = aliases.find(a => normalizeAlias(a.alias) === normalizeAlias(pendingSms.alias));
    if (!found) return;

    const fullMessage = (found.defaultPrefix || '') + pendingSms.text;
    
    const newLog: SmsLog = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      alias: found.alias,
      maskedPhone: maskPhone(found.phoneNumber),
      messagePreview: fullMessage.slice(0, 60),
      status: SmsStatus.SENT
    };

    setLogs([newLog, ...logs]);
    setIsAuthModalOpen(false);
    setPendingSms(null);
    
    // Simulate success notification
    alert(`SMS Sent to ${found.alias} (${maskPhone(found.phoneNumber)})`);
  };

  const filteredAliases = aliases.filter(a => 
    a.alias.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.phoneNumber.includes(searchQuery)
  );

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-zinc-50/80 backdrop-blur-md px-6 pt-12 pb-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
            {activeTab === 'aliases' ? 'Aliases' : activeTab === 'logs' ? 'Activity' : 'Android Source'}
          </h1>
          <div className="flex gap-2">
            <button 
              onClick={() => setIsVoiceModalOpen(true)}
              className="p-3 bg-zinc-200 rounded-2xl hover:bg-zinc-300 transition-colors"
              title="Voice Command"
            >
              <Mic className="w-6 h-6 text-zinc-700" />
            </button>
            {activeTab === 'aliases' && (
              <button 
                onClick={() => { resetForm(); setIsAddModalOpen(true); }}
                className="p-3 bg-indigo-600 rounded-2xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                title="Add New Post"
              >
                <Plus className="w-6 h-6 text-white" />
              </button>
            )}
          </div>
        </div>

        {activeTab === 'aliases' && (
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <input 
                type="text"
                placeholder="Search aliases..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-zinc-200 rounded-2xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
              />
            </div>
            
            {/* Method 2: Short Code Dialing Simulation */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Code className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-400" />
                <input 
                  type="text"
                  placeholder="Enter Short Code..."
                  value={shortCodeInput}
                  onChange={(e) => setShortCodeInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleShortCodeSubmit()}
                  className="w-full bg-indigo-50/50 border border-indigo-100 rounded-2xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono"
                />
              </div>
              <button 
                onClick={handleShortCodeSubmit}
                className="bg-indigo-600 text-white p-3 rounded-2xl hover:bg-indigo-700 transition-all active:scale-95"
              >
                <Send className="w-6 h-6" />
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Content */}
      <main className="px-6">
        {activeTab === 'aliases' && (
          <div className="space-y-4">
            {filteredAliases.length === 0 ? (
              <div className="text-center py-20">
                <div className="bg-zinc-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-8 h-8 text-zinc-400" />
                </div>
                <p className="text-zinc-500">No aliases found. Add one to get started.</p>
              </div>
            ) : (
              filteredAliases.map(alias => (
                <Card key={alias.id} className="flex justify-between items-center group">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">{alias.alias}</h3>
                      <span className="bg-zinc-100 text-zinc-500 text-[10px] px-2 py-0.5 rounded-full font-mono uppercase tracking-tighter">Code</span>
                    </div>
                    <p className="text-zinc-500 font-mono text-sm">{maskPhone(alias.phoneNumber)}</p>
                    <p className="text-xs text-zinc-400 mt-1 line-clamp-1 italic">Msg: {alias.predefinedMessage}</p>
                  </div>
                  
                  <div className="flex gap-1 items-center">
                    {/* Method 3: Direct Button */}
                    <button 
                      onClick={() => triggerSendFlow(alias)}
                      className="p-3 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-2xl transition-all active:scale-90 mr-2"
                      title="Send Predefined Message"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                    
                    <div className="h-8 w-[1px] bg-zinc-100 mx-1" />
                    
                    <button 
                      onClick={() => {
                        setEditingAlias(alias);
                        setFormAlias(alias.alias);
                        setFormPhone(alias.phoneNumber);
                        setFormPrefix(alias.defaultPrefix || '');
                        setFormMessage(alias.predefinedMessage);
                        setIsAddModalOpen(true);
                      }}
                      className="p-2 hover:bg-zinc-100 rounded-xl transition-colors"
                    >
                      <Edit2 className="w-5 h-5 text-zinc-400" />
                    </button>
                    <button 
                      onClick={() => handleDeleteAlias(alias.id)}
                      className="p-2 hover:bg-red-50 rounded-xl transition-colors"
                    >
                      <Trash2 className="w-5 h-5 text-red-400" />
                    </button>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="space-y-4">
            {logs.length === 0 ? (
              <div className="text-center py-20">
                <div className="bg-zinc-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <History className="w-8 h-8 text-zinc-400" />
                </div>
                <p className="text-zinc-500">No message history yet.</p>
              </div>
            ) : (
              logs.map(log => (
                <Card key={log.id} className="border-l-4 border-l-green-500">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                      <h4 className="font-bold text-zinc-900">To: {log.alias}</h4>
                    </div>
                    <div className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-lg text-xs font-bold">
                      <CheckCircle2 className="w-3 h-3" />
                      {log.status}
                    </div>
                  </div>
                  <p className="text-zinc-600 text-sm line-clamp-2 italic">"{log.messagePreview}..."</p>
                  <p className="text-[10px] text-zinc-400 mt-2 font-mono">{log.maskedPhone}</p>
                </Card>
              ))
            )}
          </div>
        )}

        {activeTab === 'source' && (
          <div className="space-y-6 pb-12">
            <div className="bg-zinc-900 rounded-3xl p-6 text-zinc-300 overflow-x-auto font-mono text-sm">
              <div className="flex items-center gap-2 text-indigo-400 mb-4">
                <Code className="w-5 h-5" />
                <span>shortcuts.xml</span>
              </div>
              <pre>{`<?xml version="1.0" encoding="utf-8"?>
<shortcuts xmlns:android="http://schemas.android.com/apk/res/android">
    <capability android:name="actions.intent.SEND_MESSAGE">
        <intent
            android:action="android.intent.action.VIEW"
            android:targetPackage="com.example.aliassms"
            android:targetClass="com.example.aliassms.DeepLinkActivity">
            <parameter
                android:name="message.recipient.name"
                android:key="alias"/>
            <parameter
                android:name="message.text"
                android:key="text"/>
            <data android:scheme="myapp" android:host="send" />
        </intent>
    </capability>
</shortcuts>`}</pre>
            </div>

            <div className="bg-zinc-900 rounded-3xl p-6 text-zinc-300 overflow-x-auto font-mono text-sm">
              <div className="flex items-center gap-2 text-indigo-400 mb-4">
                <Code className="w-5 h-5" />
                <span>AliasEntry.kt (Room Entity)</span>
              </div>
              <pre>{`@Entity(tableName = "aliases")
data class AliasEntry(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    @ColumnInfo(index = true) val alias: String, // Short Code / Alias
    val phoneNumber: String,
    val predefinedMessage: String, // The fixed text
    val defaultPrefix: String? = null,
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis()
)`}</pre>
            </div>

            <div className="bg-zinc-900 rounded-3xl p-6 text-zinc-300 overflow-x-auto font-mono text-sm">
              <div className="flex items-center gap-2 text-indigo-400 mb-4">
                <Code className="w-5 h-5" />
                <span>DeepLinkActivity.kt</span>
              </div>
              <pre>{`class DeepLinkActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val alias = intent.data?.getQueryParameter("alias")
        val text = intent.data?.getQueryParameter("text")
        
        if (alias != null) {
            // If text is null, we use the predefinedMessage from DB
            triggerFlow(alias, text)
        }
    }
}`}</pre>
            </div>
          </div>
        )}
      </main>

      {/* Nav Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-zinc-200 px-8 py-4 flex justify-around items-center z-40">
        <button 
          onClick={() => setActiveTab('aliases')}
          className={cn("flex flex-col items-center gap-1 transition-all", activeTab === 'aliases' ? "text-indigo-600 scale-110" : "text-zinc-400")}
        >
          <MessageSquare className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Aliases</span>
        </button>
        <button 
          onClick={() => setActiveTab('logs')}
          className={cn("flex flex-col items-center gap-1 transition-all", activeTab === 'logs' ? "text-indigo-600 scale-110" : "text-zinc-400")}
        >
          <History className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Activity</span>
        </button>
        <button 
          onClick={() => setActiveTab('source')}
          className={cn("flex flex-col items-center gap-1 transition-all", activeTab === 'source' ? "text-indigo-600 scale-110" : "text-zinc-400")}
        >
          <Code className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Source</span>
        </button>
      </nav>

      {/* Modals */}
      <Modal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        title={editingAlias ? 'Edit Post' : 'New Post'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase mb-1 ml-1">Short Code / Alias</label>
            <input 
              type="text"
              placeholder="e.g. 101 or Esmaili"
              value={formAlias}
              onChange={(e) => setFormAlias(e.target.value)}
              className="w-full bg-zinc-100 border-none rounded-2xl py-3 px-4 focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase mb-1 ml-1">Phone Number</label>
            <input 
              type="tel"
              placeholder="+61 400 000 000"
              value={formPhone}
              onChange={(e) => setFormPhone(e.target.value)}
              className="w-full bg-zinc-100 border-none rounded-2xl py-3 px-4 focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase mb-1 ml-1">Predefined Message (The Text)</label>
            <textarea 
              placeholder="e.g. come to my office"
              value={formMessage}
              onChange={(e) => setFormMessage(e.target.value)}
              className="w-full bg-zinc-100 border-none rounded-2xl py-3 px-4 focus:ring-2 focus:ring-indigo-500/20 transition-all min-h-[100px] resize-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase mb-1 ml-1">Prefix (Optional)</label>
            <input 
              type="text"
              placeholder="e.g. Mr Esmaili, "
              value={formPrefix}
              onChange={(e) => setFormPrefix(e.target.value)}
              className="w-full bg-zinc-100 border-none rounded-2xl py-3 px-4 focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
          </div>
          <Button onClick={handleSaveAlias} className="w-full py-4 mt-4">
            {editingAlias ? 'Update Post' : 'Create Post'}
          </Button>
        </div>
      </Modal>

      {/* Voice Command Simulator Modal */}
      <Modal 
        isOpen={isVoiceModalOpen} 
        onClose={() => setIsVoiceModalOpen(false)} 
        title="Google Assistant Simulator"
      >
        <div className="space-y-4">
          <p className="text-zinc-500 text-sm">Type the command as you would speak it to Google Assistant:</p>
          <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 italic text-indigo-700 text-sm">
            "Send message to Esmaili: come to my office"
          </div>
          <input 
            type="text"
            placeholder="Speak command..."
            value={voiceCommand}
            onChange={(e) => setVoiceCommand(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleVoiceCommand()}
            className="w-full bg-white border-2 border-indigo-100 rounded-2xl py-4 px-4 focus:ring-4 focus:ring-indigo-500/10 transition-all"
          />
          <Button onClick={handleVoiceCommand} className="w-full py-4">
            Process Command
          </Button>
        </div>
      </Modal>

      {/* Biometric Auth Simulation Modal */}
      <Modal 
        isOpen={isAuthModalOpen} 
        onClose={() => { setIsAuthModalOpen(false); setPendingSms(null); }} 
        title="Security Verification"
      >
        <div className="flex flex-col items-center py-8">
          <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center mb-6 animate-pulse">
            <Fingerprint className="w-12 h-12 text-indigo-600" />
          </div>
          <h3 className="text-lg font-bold mb-2">Confirm Identity</h3>
          <p className="text-zinc-500 text-center mb-8 px-4">
            Authentication required to send message to <span className="text-indigo-600 font-bold">{pendingSms?.alias}</span>
          </p>
          <div className="grid grid-cols-2 gap-4 w-full">
            <Button variant="secondary" onClick={() => { setIsAuthModalOpen(false); setPendingSms(null); }}>
              Cancel
            </Button>
            <Button onClick={handleAuthSuccess}>
              Authenticate
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
