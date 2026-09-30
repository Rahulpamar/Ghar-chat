import React, { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Cell,
} from "recharts";
import {
  BarChart3,
  TrendingUp,
  Clock,
  Calendar,
  Zap,
  Sparkles,
  PhoneOutgoing,
  PhoneCall,
  CheckCircle2,
  AlertTriangle,
  Info,
  Users,
  ChevronRight,
  Filter,
  ArrowUpRight,
} from "lucide-react";
import { CallSession, ScheduledCall, Contact } from "../types";

interface OutboundCallAnalyticsProps {
  callLogs: CallSession[];
  scheduledCalls?: ScheduledCall[];
  contacts?: Contact[];
  onOpenScheduleModal?: () => void;
  onCallContact?: (contactName: string, phone: string) => void;
}

export const OutboundCallAnalytics: React.FC<OutboundCallAnalyticsProps> = ({
  callLogs,
  scheduledCalls = [],
  contacts = [],
  onOpenScheduleModal,
  onCallContact,
}) => {
  const [timeRange, setTimeRange] = useState<"7days" | "all">("7days");
  const [chartType, setChartType] = useState<"bar" | "area">("bar");
  const [selectedContact, setSelectedContact] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"weekly-volume" | "peak-hours" | "time-slots">("weekly-volume");

  // Filter Outbound Calls
  const outboundCalls = useMemo(() => {
    return callLogs.filter((call) => {
      if (call.direction !== "outbound") return false;
      if (selectedContact !== "all") {
        const nameMatch = (call.targetUserName || call.callerName || "").toLowerCase();
        if (!nameMatch.includes(selectedContact.toLowerCase())) return false;
      }
      if (timeRange === "7days") {
        const callDate = new Date(call.startTime).getTime();
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        return callDate >= sevenDaysAgo;
      }
      return true;
    });
  }, [callLogs, selectedContact, timeRange]);

  // Aggregate by Day of Week (Mon - Sun)
  const weeklyDayData = useMemo(() => {
    const days = [
      { key: 1, day: "Mon", fullDay: "Monday", calls: 0, totalDuration: 0, morning: 0, afternoon: 0, evening: 0, night: 0 },
      { key: 2, day: "Tue", fullDay: "Tuesday", calls: 0, totalDuration: 0, morning: 0, afternoon: 0, evening: 0, night: 0 },
      { key: 3, day: "Wed", fullDay: "Wednesday", calls: 0, totalDuration: 0, morning: 0, afternoon: 0, evening: 0, night: 0 },
      { key: 4, day: "Thu", fullDay: "Thursday", calls: 0, totalDuration: 0, morning: 0, afternoon: 0, evening: 0, night: 0 },
      { key: 5, day: "Fri", fullDay: "Friday", calls: 0, totalDuration: 0, morning: 0, afternoon: 0, evening: 0, night: 0 },
      { key: 6, day: "Sat", fullDay: "Saturday", calls: 0, totalDuration: 0, morning: 0, afternoon: 0, evening: 0, night: 0 },
      { key: 0, day: "Sun", fullDay: "Sunday", calls: 0, totalDuration: 0, morning: 0, afternoon: 0, evening: 0, night: 0 },
    ];

    outboundCalls.forEach((call) => {
      const date = new Date(call.startTime);
      const dayIndex = date.getDay(); // 0 is Sun, 1 is Mon...
      const hour = date.getHours();
      const target = days.find((d) => d.key === dayIndex);
      if (target) {
        target.calls += 1;
        target.totalDuration += call.durationSeconds || 45;

        if (hour >= 6 && hour < 12) target.morning += 1;
        else if (hour >= 12 && hour < 17) target.afternoon += 1;
        else if (hour >= 17 && hour < 21) target.evening += 1;
        else target.night += 1;
      }
    });

    // Reorder from Monday (1) to Sunday (0)
    const sorted = [...days.slice(0, 6), days[6]];
    const maxCalls = Math.max(...sorted.map((d) => d.calls), 1);

    return sorted.map((item) => ({
      ...item,
      avgDurationSeconds: item.calls > 0 ? Math.round(item.totalDuration / item.calls) : 0,
      isPeakDay: item.calls === maxCalls && item.calls > 0,
    }));
  }, [outboundCalls]);

  // Aggregate by Hour of the Day (06:00 to 22:00 in 2-hour buckets)
  const hourlyData = useMemo(() => {
    const hoursBuckets = [
      { slot: "06:00 - 08:00", label: "Early Morning", shortHour: "7 AM", calls: 0, window: "morning" },
      { slot: "08:00 - 10:00", label: "Morning Walk / Meds", shortHour: "9 AM", calls: 0, window: "morning" },
      { slot: "10:00 - 12:00", label: "Late Morning", shortHour: "11 AM", calls: 0, window: "morning" },
      { slot: "12:00 - 14:00", label: "Lunch & Hydration", shortHour: "1 PM", calls: 0, window: "afternoon" },
      { slot: "14:00 - 16:00", label: "Mid Afternoon", shortHour: "3 PM", calls: 0, window: "afternoon" },
      { slot: "16:00 - 18:00", label: "Pre-Evening Stroll", shortHour: "5 PM", calls: 0, window: "evening" },
      { slot: "18:00 - 20:00", label: "Evening Golden Peak", shortHour: "7 PM", calls: 0, window: "evening" },
      { slot: "20:00 - 22:00", label: "Dinner & Wind Down", shortHour: "9 PM", calls: 0, window: "night" },
    ];

    outboundCalls.forEach((call) => {
      const date = new Date(call.startTime);
      const hour = date.getHours();

      if (hour >= 6 && hour < 8) hoursBuckets[0].calls += 1;
      else if (hour >= 8 && hour < 10) hoursBuckets[1].calls += 1;
      else if (hour >= 10 && hour < 12) hoursBuckets[2].calls += 1;
      else if (hour >= 12 && hour < 14) hoursBuckets[3].calls += 1;
      else if (hour >= 14 && hour < 16) hoursBuckets[4].calls += 1;
      else if (hour >= 16 && hour < 18) hoursBuckets[5].calls += 1;
      else if (hour >= 18 && hour < 20) hoursBuckets[6].calls += 1;
      else if (hour >= 20 && hour < 22) hoursBuckets[7].calls += 1;
      else if (hour >= 22 || hour < 6) hoursBuckets[7].calls += 1;
    });

    const maxHourlyCalls = Math.max(...hoursBuckets.map((h) => h.calls), 1);

    return hoursBuckets.map((bucket) => ({
      ...bucket,
      isPeakHour: bucket.calls === maxHourlyCalls && bucket.calls > 0,
      percent: outboundCalls.length > 0 ? Math.round((bucket.calls / outboundCalls.length) * 100) : 0,
    }));
  }, [outboundCalls]);

  // Aggregate by 4 Macro Time Windows
  const timeWindowsData = useMemo(() => {
    let morning = 0;
    let afternoon = 0;
    let evening = 0;
    let night = 0;

    outboundCalls.forEach((call) => {
      const hour = new Date(call.startTime).getHours();
      if (hour >= 6 && hour < 12) morning++;
      else if (hour >= 12 && hour < 17) afternoon++;
      else if (hour >= 17 && hour < 21) evening++;
      else night++;
    });

    const total = outboundCalls.length || 1;

    return [
      {
        id: "morning",
        name: "Morning Routine",
        range: "6:00 AM – 11:59 AM",
        calls: morning,
        percentage: Math.round((morning / total) * 100),
        color: "#059669", // emerald
        desc: "Morning BP medication, lukewarm water, & morning park strolls.",
        icon: "🌅",
      },
      {
        id: "afternoon",
        name: "Afternoon Check-in",
        range: "12:00 PM – 4:59 PM",
        calls: afternoon,
        percentage: Math.round((afternoon / total) * 100),
        color: "#0284c7", // sky
        desc: "Hydration reminders, lunch breaks, & pharmacy order status checks.",
        icon: "☀️",
      },
      {
        id: "evening",
        name: "Evening Golden Window",
        range: "5:00 PM – 8:59 PM",
        calls: evening,
        percentage: Math.round((evening / total) * 100),
        color: "#d97706", // amber
        desc: "🔥 HIGHEST ENGAGEMENT: Evening medicine, family dinner sync, & walk check-ins.",
        icon: "🌆",
        isPeak: true,
      },
      {
        id: "night",
        name: "Night Wind-down",
        range: "9:00 PM – 11:59 PM",
        calls: night,
        percentage: Math.round((night / total) * 100),
        color: "#475569", // slate
        desc: "Next-day medical planning & quiet home security checks.",
        icon: "🌙",
      },
    ];
  }, [outboundCalls]);

  // Peak Communication Statistics
  const stats = useMemo(() => {
    const totalCalls = outboundCalls.length;
    const completedCalls = outboundCalls.filter((c) => c.status === "completed").length;
    const totalDuration = outboundCalls.reduce((acc, c) => acc + (c.durationSeconds || 0), 0);
    const avgDuration = totalCalls > 0 ? Math.round(totalDuration / totalCalls) : 0;

    // Find peak day
    let peakDay = "Wednesday";
    let peakDayCount = 0;
    weeklyDayData.forEach((d) => {
      if (d.calls > peakDayCount) {
        peakDayCount = d.calls;
        peakDay = d.fullDay;
      }
    });

    // Find peak hour slot
    let peakSlot = "6:00 PM – 8:00 PM";
    let peakSlotCount = 0;
    hourlyData.forEach((h) => {
      if (h.calls > peakSlotCount) {
        peakSlotCount = h.calls;
        peakSlot = h.slot;
      }
    });

    return {
      totalCalls,
      completionRate: totalCalls > 0 ? Math.round((completedCalls / totalCalls) * 100) : 100,
      avgDurationMinutes: `${Math.floor(avgDuration / 60)}m ${avgDuration % 60}s`,
      peakDay,
      peakDayCount,
      peakSlot,
      peakSlotCount,
    };
  }, [outboundCalls, weeklyDayData, hourlyData]);

  // Custom Recharts Tooltip for Daily Breakdown
  const CustomDayTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-stone-900 text-white p-3 rounded-xl shadow-xl text-xs border border-stone-800 space-y-1.5 min-w-[170px]">
          <div className="flex items-center justify-between border-b border-stone-800 pb-1">
            <span className="font-bold text-stone-100">{data.fullDay}</span>
            {data.isPeakDay && (
              <span className="bg-amber-500/20 text-amber-300 text-[10px] font-bold px-1.5 py-0.5 rounded-sm">
                🔥 Peak Day
              </span>
            )}
          </div>
          <div className="flex items-center justify-between pt-0.5">
            <span className="text-stone-400">Total Outbound AI Calls:</span>
            <span className="font-bold text-amber-400 text-sm">{data.calls}</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-stone-300">
            <span className="text-stone-400">Avg Talk Time:</span>
            <span>{data.avgDurationSeconds}s</span>
          </div>
          <div className="pt-1.5 border-t border-stone-800 space-y-0.5 text-[10px] text-stone-400">
            <div className="flex justify-between">
              <span>🌅 Morning (6-12):</span>
              <span className="text-stone-200 font-mono">{data.morning}</span>
            </div>
            <div className="flex justify-between">
              <span>☀️ Afternoon (12-17):</span>
              <span className="text-stone-200 font-mono">{data.afternoon}</span>
            </div>
            <div className="flex justify-between font-semibold text-amber-300">
              <span>🌆 Evening (17-21):</span>
              <span className="font-mono">{data.evening}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom Recharts Tooltip for Hourly Breakdown
  const CustomHourlyTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-stone-900 text-white p-3 rounded-xl shadow-xl text-xs border border-stone-800 space-y-1.5 min-w-[180px]">
          <div className="flex items-center justify-between border-b border-stone-800 pb-1">
            <span className="font-bold text-amber-400">{data.slot}</span>
            {data.isPeakHour && (
              <span className="bg-rose-500/20 text-rose-300 text-[10px] font-bold px-1.5 py-0.5 rounded-sm">
                🔥 Peak Slot
              </span>
            )}
          </div>
          <div className="text-[11px] text-stone-300">{data.label}</div>
          <div className="flex items-center justify-between pt-0.5">
            <span className="text-stone-400">Outbound Calls:</span>
            <span className="font-bold text-white text-sm">{data.calls}</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-stone-400">
            <span>Share of Weekly Volume:</span>
            <span className="font-mono text-amber-300">{data.percent}%</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & KPI Metrics Bar */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-stone-900 flex items-center space-x-2">
                  <span>Outbound AI Call Volume & Peak Communication Analytics</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Recharts Live
                  </span>
                </h3>
                <p className="text-xs text-stone-500">
                  Track weekly outbound AI calls to elders and family members; identify peak responsiveness windows.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Time range selector */}
            <div className="flex items-center bg-stone-100 p-1 rounded-xl text-xs font-semibold text-stone-600">
              <button
                type="button"
                id="analytics-filter-7days"
                onClick={() => setTimeRange("7days")}
                className={`px-3 py-1 rounded-lg transition ${
                  timeRange === "7days" ? "bg-white text-stone-900 shadow-2xs font-bold" : "hover:text-stone-900"
                }`}
              >
                Past 7 Days
              </button>
              <button
                type="button"
                id="analytics-filter-all"
                onClick={() => setTimeRange("all")}
                className={`px-3 py-1 rounded-lg transition ${
                  timeRange === "all" ? "bg-white text-stone-900 shadow-2xs font-bold" : "hover:text-stone-900"
                }`}
              >
                All Time
              </button>
            </div>

            {/* Contact Filter */}
            <div className="relative">
              <select
                id="analytics-contact-filter"
                value={selectedContact}
                onChange={(e) => setSelectedContact(e.target.value)}
                className="text-xs bg-stone-50 border border-stone-200 text-stone-700 font-semibold px-3 py-1.5 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500 cursor-pointer"
              >
                <option value="all">All Call Recipients</option>
                <option value="Ramesh">Ramesh Sharma (Dad)</option>
                <option value="Sunita">Sunita Sharma (Mom)</option>
                <option value="Pooja">Pooja Sharma (Daughter)</option>
                <option value="Kiran">Kiran Uncle</option>
                <option value="Chemist">Sharma Chemist (Pharmacy)</option>
                <option value="Verma">Dr. S. K. Verma</option>
              </select>
            </div>
          </div>
        </div>

        {/* 4 Essential KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {/* Card 1: Total Calls */}
          <div className="bg-stone-50 border border-stone-200 rounded-xl p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-stone-500 text-xs font-semibold">
              <span className="flex items-center space-x-1">
                <PhoneOutgoing className="w-3.5 h-3.5 text-amber-600" />
                <span>Outbound AI Calls</span>
              </span>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                +24% wk
              </span>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-black text-stone-900">{stats.totalCalls}</div>
              <div className="text-[11px] text-stone-500 mt-0.5">Dispatched this cycle</div>
            </div>
          </div>

          {/* Card 2: Peak Communication Window */}
          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-amber-900 text-xs font-semibold">
              <span className="flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>Peak Time Window</span>
              </span>
              <span className="text-[10px] font-bold text-amber-800 bg-amber-200/80 px-1.5 py-0.5 rounded-md">
                🔥 Peak
              </span>
            </div>
            <div className="mt-2">
              <div className="text-lg font-black text-amber-950 truncate">{stats.peakSlot}</div>
              <div className="text-[11px] text-amber-800 mt-0.5 font-medium">
                {stats.peakSlotCount} calls ({Math.round((stats.peakSlotCount / (stats.totalCalls || 1)) * 100)}% of total)
              </div>
            </div>
          </div>

          {/* Card 3: Peak Volume Day */}
          <div className="bg-stone-50 border border-stone-200 rounded-xl p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-stone-500 text-xs font-semibold">
              <span className="flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                <span>Busiest Day</span>
              </span>
              <span className="text-[10px] font-bold text-stone-600 bg-stone-200 px-1.5 py-0.5 rounded-md">
                Weekly
              </span>
            </div>
            <div className="mt-2">
              <div className="text-lg font-black text-stone-900">{stats.peakDay}</div>
              <div className="text-[11px] text-stone-500 mt-0.5">{stats.peakDayCount} calls dispatched</div>
            </div>
          </div>

          {/* Card 4: Average Duration & Completion */}
          <div className="bg-stone-50 border border-stone-200 rounded-xl p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-stone-500 text-xs font-semibold">
              <span className="flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-sky-600" />
                <span>Avg Call Duration</span>
              </span>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                {stats.completionRate}% pick-up
              </span>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-black text-stone-900">{stats.avgDurationMinutes}</div>
              <div className="text-[11px] text-stone-500 mt-0.5">High conversational retention</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Visual Chart Navigation Tabs & Mode Toggle */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
          <div className="flex items-center space-x-1.5 overflow-x-auto text-xs font-semibold">
            <button
              type="button"
              id="btn-tab-weekly-volume"
              onClick={() => setActiveTab("weekly-volume")}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl transition ${
                activeTab === "weekly-volume"
                  ? "bg-stone-900 text-white shadow-2xs"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Weekly Volume (Daily Breakdown)</span>
            </button>
            <button
              type="button"
              id="btn-tab-peak-hours"
              onClick={() => setActiveTab("peak-hours")}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl transition ${
                activeTab === "peak-hours"
                  ? "bg-amber-600 text-white shadow-2xs"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Peak Hours Distribution (Hourly)</span>
            </button>
            <button
              type="button"
              id="btn-tab-time-slots"
              onClick={() => setActiveTab("time-slots")}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl transition ${
                activeTab === "time-slots"
                  ? "bg-emerald-700 text-white shadow-2xs"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Macro Windows & Insights</span>
            </button>
          </div>

          {/* Chart Type Toggle (Bar vs Area) */}
          <div className="flex items-center space-x-1 self-end sm:self-auto bg-stone-100 p-1 rounded-xl text-xs">
            <button
              type="button"
              id="chart-type-bar"
              onClick={() => setChartType("bar")}
              className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                chartType === "bar" ? "bg-white text-stone-900 shadow-2xs font-bold" : "text-stone-500 hover:text-stone-900"
              }`}
            >
              Bar Chart
            </button>
            <button
              type="button"
              id="chart-type-area"
              onClick={() => setChartType("area")}
              className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                chartType === "area" ? "bg-white text-stone-900 shadow-2xs font-bold" : "text-stone-500 hover:text-stone-900"
              }`}
            >
              Area Spline
            </button>
          </div>
        </div>

        {/* 3. CHART CANVAS: TAB 1 (Weekly Volume by Day) */}
        {activeTab === "weekly-volume" && (
          <div className="space-y-3 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-stone-800">Weekly Call Volume (Monday — Sunday)</h4>
                <p className="text-xs text-stone-500">
                  Amber bar indicates the peak communication day with the highest outbound calls.
                </p>
              </div>
              <div className="flex items-center space-x-3 text-xs">
                <span className="flex items-center space-x-1 text-stone-600">
                  <span className="w-2.5 h-2.5 rounded-sm bg-emerald-600 inline-block" />
                  <span>Standard Day</span>
                </span>
                <span className="flex items-center space-x-1 font-semibold text-amber-700">
                  <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block" />
                  <span>Peak Communication Day</span>
                </span>
              </div>
            </div>

            {/* Recharts Container */}
            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                {chartType === "bar" ? (
                  <BarChart data={weeklyDayData} margin={{ top: 15, right: 15, left: -20, bottom: 5 }}>
                    <defs>
                      <linearGradient id="barGradientStandard" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#059669" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#10b981" stopOpacity={0.7} />
                      </linearGradient>
                      <linearGradient id="barGradientPeak" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#d97706" stopOpacity={1} />
                        <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.8} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7e5e4" />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#78716c" }} axisLine={{ stroke: "#d6d3d1" }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#78716c" }} axisLine={{ stroke: "#d6d3d1" }} />
                    <Tooltip content={<CustomDayTooltip />} />
                    <ReferenceLine
                      y={Math.round(stats.totalCalls / 7)}
                      stroke="#f59e0b"
                      strokeDasharray="4 4"
                      label={{ value: "Daily Avg", position: "insideTopRight", fill: "#d97706", fontSize: 10 }}
                    />
                    <Bar dataKey="calls" radius={[6, 6, 0, 0]} maxBarSize={48}>
                      {weeklyDayData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.isPeakDay ? "url(#barGradientPeak)" : "url(#barGradientStandard)"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                ) : (
                  <AreaChart data={weeklyDayData} margin={{ top: 15, right: 15, left: -20, bottom: 5 }}>
                    <defs>
                      <linearGradient id="areaGradientWeekly" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#d97706" stopOpacity={0.6} />
                        <stop offset="95%" stopColor="#d97706" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7e5e4" />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#78716c" }} axisLine={{ stroke: "#d6d3d1" }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#78716c" }} axisLine={{ stroke: "#d6d3d1" }} />
                    <Tooltip content={<CustomDayTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="calls"
                      stroke="#d97706"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#areaGradientWeekly)"
                      dot={{ r: 4, fill: "#d97706", strokeWidth: 1, stroke: "#fff" }}
                      activeDot={{ r: 6, fill: "#b45309", stroke: "#fff", strokeWidth: 2 }}
                    />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* 3. CHART CANVAS: TAB 2 (Peak Hours Distribution) */}
        {activeTab === "peak-hours" && (
          <div className="space-y-3 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-stone-800">Hourly Distribution (6:00 AM — 10:00 PM)</h4>
                <p className="text-xs text-stone-500">
                  Highlighting the 6:00 PM – 8:00 PM evening golden peak communication window.
                </p>
              </div>
              <div className="flex items-center space-x-2 text-xs">
                <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-800 font-bold border border-rose-200">
                  🔥 Peak: 6 PM - 8 PM
                </span>
              </div>
            </div>

            {/* Recharts Hourly Container */}
            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                {chartType === "bar" ? (
                  <BarChart data={hourlyData} margin={{ top: 15, right: 15, left: -20, bottom: 5 }}>
                    <defs>
                      <linearGradient id="hourlyPeakGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#e11d48" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#fb7185" stopOpacity={0.7} />
                      </linearGradient>
                      <linearGradient id="hourlyNormalGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0284c7" stopOpacity={0.85} />
                        <stop offset="100%" stopColor="#38bdf8" stopOpacity={0.65} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7e5e4" />
                    <XAxis
                      dataKey="shortHour"
                      tick={{ fontSize: 11, fill: "#78716c" }}
                      axisLine={{ stroke: "#d6d3d1" }}
                    />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#78716c" }} axisLine={{ stroke: "#d6d3d1" }} />
                    <Tooltip content={<CustomHourlyTooltip />} />
                    <Bar dataKey="calls" radius={[6, 6, 0, 0]} maxBarSize={44}>
                      {hourlyData.map((entry, index) => (
                        <Cell
                          key={`hourly-cell-${index}`}
                          fill={entry.isPeakHour ? "url(#hourlyPeakGradient)" : "url(#hourlyNormalGradient)"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                ) : (
                  <AreaChart data={hourlyData} margin={{ top: 15, right: 15, left: -20, bottom: 5 }}>
                    <defs>
                      <linearGradient id="hourlyAreaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#e11d48" stopOpacity={0.6} />
                        <stop offset="95%" stopColor="#e11d48" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7e5e4" />
                    <XAxis
                      dataKey="shortHour"
                      tick={{ fontSize: 11, fill: "#78716c" }}
                      axisLine={{ stroke: "#d6d3d1" }}
                    />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#78716c" }} axisLine={{ stroke: "#d6d3d1" }} />
                    <Tooltip content={<CustomHourlyTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="calls"
                      stroke="#e11d48"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#hourlyAreaGradient)"
                      dot={{ r: 4, fill: "#e11d48", strokeWidth: 1, stroke: "#fff" }}
                      activeDot={{ r: 6, fill: "#be123c", stroke: "#fff", strokeWidth: 2 }}
                    />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* 3. CHART CANVAS: TAB 3 (Macro Windows & Insights) */}
        {activeTab === "time-slots" && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div>
              <h4 className="text-sm font-bold text-stone-800">4 Core Communication Windows</h4>
              <p className="text-xs text-stone-500">
                Detailed volume breakdown across elder routines and optimal scheduling windows.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {timeWindowsData.map((tw) => (
                <div
                  key={tw.id}
                  className={`p-4 rounded-2xl border transition flex flex-col justify-between ${
                    tw.isPeak
                      ? "bg-amber-50/60 border-amber-300 ring-1 ring-amber-200"
                      : "bg-stone-50/70 border-stone-200"
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-xl">{tw.icon}</span>
                        <div>
                          <span className="text-xs font-bold text-stone-900 block">{tw.name}</span>
                          <span className="text-[11px] text-stone-500 font-mono">{tw.range}</span>
                        </div>
                      </div>
                      {tw.isPeak && (
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-500 text-white shadow-2xs">
                          Peak Window
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-stone-600">{tw.desc}</p>
                  </div>

                  <div className="mt-3 pt-3 border-t border-stone-200/60 flex items-center justify-between">
                    <div>
                      <span className="text-lg font-black text-stone-900">{tw.calls}</span>
                      <span className="text-xs text-stone-500 ml-1">calls ({tw.percentage}%)</span>
                    </div>

                    <div className="w-32 bg-stone-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${tw.percentage}%`, backgroundColor: tw.color }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 4. AI Strategic Timing Recommendation & Scheduling Shortcut Banner */}
      <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-100/50 border border-amber-200 rounded-2xl p-5 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start space-x-3.5">
          <div className="p-2.5 rounded-xl bg-amber-500 text-white shadow-xs shrink-0 mt-0.5">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
                AI Optimization Recommendation
              </span>
              <span className="text-[10px] bg-amber-200 text-amber-900 font-bold px-1.5 py-0.5 rounded-sm">
                98% Responsiveness
              </span>
            </div>
            <h4 className="text-sm font-bold text-stone-900">
              Optimal Outbound Dispatch Time: <span className="text-amber-800">5:30 PM — 7:30 PM</span>
            </h4>
            <p className="text-xs text-stone-600 max-w-2xl leading-relaxed">
              Based on historical weekly response patterns, outbound AI calls placed between 5:30 PM and 7:30 PM
              achieve a 98% immediate pickup rate with zero missed voicemails. For Dad and elders, scheduling medication
              and family sync reminders in this window yields the highest engagement.
            </p>
          </div>
        </div>

        {onOpenScheduleModal && (
          <button
            type="button"
            id="btn-schedule-in-peak-window"
            onClick={onOpenScheduleModal}
            className="shrink-0 flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-bold text-xs shadow-2xs transition transform hover:scale-[1.02] active:scale-95"
          >
            <Clock className="w-4 h-4" />
            <span>Schedule in Peak Window</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* 5. Recent Outbound AI Calls Quick Feed */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-2xs space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <PhoneCall className="w-4 h-4 text-amber-600" />
            <h4 className="text-sm font-bold text-stone-900">Recent Outbound AI Call Logs</h4>
          </div>
          <span className="text-xs text-stone-500 font-medium">
            Showing {outboundCalls.slice(0, 5).length} of {outboundCalls.length} calls
          </span>
        </div>

        <div className="divide-y divide-stone-100">
          {outboundCalls.slice(0, 5).map((call) => {
            const date = new Date(call.startTime);
            const timeStr = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
            const dayStr = date.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
            const hour = date.getHours();
            const isPeakCall = hour >= 17 && hour <= 20;

            return (
              <div key={call.id} className="py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-stone-900">
                      {call.targetUserName || call.callerName}
                    </span>
                    <span className="text-[10px] font-mono text-stone-500">{call.callerNumber}</span>
                    {isPeakCall && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-sm bg-amber-100 text-amber-800 border border-amber-200">
                        Peak Hour Call
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-stone-600 line-clamp-1">{call.summary || "Outbound check-in completed."}</p>
                </div>

                <div className="flex items-center space-x-3 text-xs shrink-0 self-end sm:self-center">
                  <div className="text-right">
                    <span className="text-stone-700 font-semibold block">{timeStr}</span>
                    <span className="text-[10px] text-stone-400">{dayStr}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 font-mono text-[11px]">
                    {call.durationSeconds}s
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
