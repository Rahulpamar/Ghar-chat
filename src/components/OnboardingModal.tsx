import React, { useState } from "react";
import { X, UserCheck, ShieldCheck, HeartHandshake, Phone } from "lucide-react";
import { Relationship } from "../types";

interface OnboardingModalProps {
  token: string;
  isOpen: boolean;
  onClose: () => void;
  onJoinSuccess: (member: any) => void;
}

const RELATIONSHIPS: Relationship[] = [
  "Mom",
  "Dad",
  "Son",
  "Daughter",
  "Grandparent",
  "Sibling",
  "Spouse",
  "Relative",
];

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  token,
  isOpen,
  onClose,
  onJoinSuccess,
}) => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [relationship, setRelationship] = useState<Relationship>("Relative");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      setErrorMsg("Please enter both your name and mobile phone number.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/invites/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          name: name.trim(),
          phone: phone.trim(),
          relationship,
        }),
      });
      const data = await res.json();
      if (data.success && data.member) {
        onJoinSuccess(data.member);
        onClose();
      } else {
        setErrorMsg(data.error || "Failed to join via invite token.");
      }
    } catch (err: any) {
      setErrorMsg("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-md w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-xs">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900">Join GharCall Family</h3>
              <p className="text-xs text-stone-500 font-mono">Token: {token}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 p-1.5 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="space-y-1">
            <label className="font-semibold text-stone-700">Full Name *</label>
            <input
              id="onboard-name-input"
              type="text"
              required
              placeholder="e.g. Sunita Sharma or Priya"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2.5 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-stone-700">Primary Mobile Phone Number *</label>
            <input
              id="onboard-phone-input"
              type="tel"
              required
              placeholder="+91 98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2.5 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-stone-700">Family Relationship</label>
            <select
              id="onboard-relationship-select"
              value={relationship}
              onChange={(e) => setRelationship(e.target.value as Relationship)}
              className="w-full px-3 py-2.5 border border-stone-200 rounded-xl bg-stone-50 focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              {RELATIONSHIPS.map((rel) => (
                <option key={rel} value={rel}>
                  {rel}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-3 border-t border-stone-100 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-xl font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="onboard-submit-btn"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white font-semibold rounded-xl flex items-center space-x-1.5 shadow-sm"
            >
              <UserCheck className="w-4 h-4" />
              <span>{isSubmitting ? "Joining..." : "Complete Onboarding"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
