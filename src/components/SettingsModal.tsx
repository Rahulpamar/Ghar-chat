import React, { useState } from "react";
import { 
  Settings, 
  Phone, 
  Bot, 
  ShieldCheck, 
  Sparkles, 
  Radio, 
  Copy, 
  Check, 
  Save, 
  RefreshCw,
  ExternalLink
} from "lucide-react";
import { AppSettings, Role } from "../types";

interface SettingsModalProps {
  settings: AppSettings;
  userRole: Role;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  userRole,
  onUpdateSettings,
}) => {
  const [virtualPhoneNumber, setVirtualPhoneNumber] = useState(settings.virtualPhoneNumber);
  const [primaryForwardPhone, setPrimaryForwardPhone] = useState(settings.primaryForwardPhone);
  const [primaryHostName, setPrimaryHostName] = useState(settings.primaryHostName);
  const [greetingTemplate, setGreetingTemplate] = useState(settings.greetingTemplate);
  const [urgencyKeywords, setUrgencyKeywords] = useState(settings.urgencyKeywords.join(", "));
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const isAdmin = userRole === "admin";

  const webhookUrl = typeof window !== "undefined"
    ? `${window.location.origin}/api/telephony/inbound`
    : "https://gharcall.app/api/telephony/inbound";

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    onUpdateSettings({
      virtualPhoneNumber,
      primaryForwardPhone,
      primaryHostName,
      greetingTemplate,
      urgencyKeywords: urgencyKeywords.split(",").map((k) => k.trim()).filter(Boolean),
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-9 h-9 rounded-xl bg-stone-900 text-white flex items-center justify-center">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-stone-900">Telephony & AI Voice Configuration</h2>
            <p className="text-xs text-stone-500">
              Manage Twilio webhooks, virtual family numbers, and Telugu conversational greeting parameters.
            </p>
          </div>
        </div>

        {!isAdmin && (
          <div className="mt-3 p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-600">
            Note: You are viewing settings as a standard family member. Only administrators can save modifications.
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Telephony Routing Section */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 border-b border-stone-100 pb-3">
            <Phone className="w-4 h-4 text-amber-600" />
            <h3 className="text-sm font-bold text-stone-900">Virtual Number & Forwarding Target</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-stone-700">Virtual Family Phone Number</label>
              <input
                id="virtual-phone-input"
                type="text"
                disabled={!isAdmin}
                value={virtualPhoneNumber}
                onChange={(e) => setVirtualPhoneNumber(e.target.value)}
                className="w-full px-3 py-2.5 border border-stone-200 rounded-xl font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              <span className="text-[11px] text-stone-400">
                Number where callers dial (Twilio virtual line)
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-stone-700">Primary Mobile Phone (Live Bridge Destination)</label>
              <input
                id="primary-forward-phone-input"
                type="text"
                disabled={!isAdmin}
                value={primaryForwardPhone}
                onChange={(e) => setPrimaryForwardPhone(e.target.value)}
                className="w-full px-3 py-2.5 border border-stone-200 rounded-xl font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              <span className="text-[11px] text-stone-400">
                Where the call is bridged live immediately when urgency ("Aunu") is triggered
              </span>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="font-semibold text-stone-700">Primary Host / Family Head Name</label>
              <input
                id="primary-host-name-input"
                type="text"
                disabled={!isAdmin}
                value={primaryHostName}
                onChange={(e) => setPrimaryHostName(e.target.value)}
                className="w-full px-3 py-2.5 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              <span className="text-[11px] text-stone-400">
                Injected dynamically into the assistant's greeting: "menu [User Name] ki assistant ni"
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic Telugu Greeting & Urgency Triggers */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 border-b border-stone-100 pb-3">
            <Bot className="w-4 h-4 text-amber-600" />
            <h3 className="text-sm font-bold text-stone-900">Dynamic AI Voice Greeting & Urgency Logic</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-stone-700">Conversational Greeting Template</label>
              <textarea
                id="greeting-template-textarea"
                rows={2}
                disabled={!isAdmin}
                value={greetingTemplate}
                onChange={(e) => setGreetingTemplate(e.target.value)}
                className="w-full p-3 border border-stone-200 rounded-xl font-mono focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none"
              />
              <span className="text-[11px] text-stone-400">
                Variables: <code className="bg-stone-100 px-1 py-0.5 rounded">{"{callerName}"}</code> and{" "}
                <code className="bg-stone-100 px-1 py-0.5 rounded">{"{userName}"}</code>
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-stone-700">Urgency Keywords (Comma-separated)</label>
              <input
                id="urgency-keywords-input"
                type="text"
                disabled={!isAdmin}
                value={urgencyKeywords}
                onChange={(e) => setUrgencyKeywords(e.target.value)}
                className="w-full px-3 py-2.5 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
              />
              <span className="text-[11px] text-stone-400">
                When the caller speaks any of these words (e.g. "Aunu", "urgent", "avunu"), live forwarding is triggered.
              </span>
            </div>
          </div>
        </div>

        {/* Twilio & Telephony Webhook Endpoint */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm space-y-3">
          <div className="flex items-center space-x-2 border-b border-stone-100 pb-3">
            <Radio className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-stone-900">Twilio Voice Webhook Integration</h3>
          </div>

          <p className="text-xs text-stone-600 leading-relaxed">
            In your Twilio Console, under your phone number's <strong>"A Call Comes In"</strong> webhook, configure
            the following URL with HTTP POST:
          </p>

          <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 flex items-center justify-between gap-2">
            <span className="font-mono text-xs text-stone-800 truncate">{webhookUrl}</span>
            <button
              type="button"
              id="settings-copy-webhook-btn"
              onClick={handleCopyWebhook}
              className="flex items-center space-x-1 bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs px-2.5 py-1.5 rounded-lg transition"
            >
              {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedUrl ? "Copied" : "Copy"}</span>
            </button>
          </div>
        </div>

        {isAdmin && (
          <div className="flex items-center justify-end space-x-3">
            {savedSuccess && (
              <span className="text-xs text-emerald-600 font-semibold flex items-center space-x-1">
                <Check className="w-4 h-4" />
                <span>Settings saved and broadcasted to all devices!</span>
              </span>
            )}
            <button
              type="submit"
              id="save-settings-btn"
              className="py-2.5 px-5 bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs rounded-xl flex items-center space-x-1.5 shadow-sm transition"
            >
              <Save className="w-4 h-4" />
              <span>Save Configuration</span>
            </button>
          </div>
        )}
      </form>
    </div>
  );
};
