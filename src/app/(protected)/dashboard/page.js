'use client';

import { useState, useEffect } from 'react';
import Link from "next/link";
import { format, subDays } from 'date-fns';
import {
  LayoutDashboard,
  MapPin,
  Store,
  Video,
  Camera,
  Coins,
  Bell,
  ExternalLink,
  Users,
  LogIn,
  UserPlus,
  ShoppingCart,
  CreditCard,
  RefreshCw,
  TrendingUp,
  Heart,
  Layers,
  Gift
} from "lucide-react";
import PageHeader, { StatusPill } from "@/components/common/PageHeader";

const DASHBOARD_ITEMS = [
  {
    title: "Update Rate",
    description: "Manage daily rates for gold, silver, and platinum pages.",
    href: "/dashboard/update-rate",
    icon: TrendingUp,
    color: "bg-warn-bg text-warn-fg border-transparent"
  },
  {
    title: "User Activity",
    description: "Track successful logins, registrations, and active session completions.",
    href: "/dashboard/user-activity",
    icon: Users,
    color: "bg-ok-bg text-ok-fg border-transparent",
    isTracking: true
  },
  {
    title: "Orders",
    description: "View and track confirmed payments and orders placed through the website.",
    href: "/dashboard/payments",
    icon: CreditCard,
    color: "bg-brand-tint text-brand border-transparent"
  },
  {
    title: "Abandoned Carts",
    description: "Real-time view of customer shopping carts across the store.",
    href: "/dashboard/carts",
    icon: ShoppingCart,
    color: "bg-brand-tint text-brand border-transparent"
  },
  {
    title: "User Wishlists",
    description: "Monitor customer wishlists and saved items.",
    href: "/dashboard/wishlists",
    icon: Heart,
    color: "bg-brand-tint text-brand border-transparent"
  },
  {
    title: "Topbar Offers",
    description: "Update announcements and promotional messages in the header.",
    href: "/dashboard/topbar-offers",
    icon: Bell,
    color: "bg-brand-tint text-brand border-transparent"
  },
  {
    title: "Pincode Management",
    description: "Manage serviceable pincodes, delivery times, and locations.",
    href: "/dashboard/pincodes",
    icon: MapPin,
    color: "bg-brand-tint text-brand border-transparent"
  },
  {
    title: "Store Management",
    description: "Update physical store locations, contact details, and images.",
    href: "/dashboard/stores",
    icon: Store,
    color: "bg-brand-tint text-brand border-transparent"
  },
  {
    title: "Curated Looks",
    description: "Manage shop-the-look sets and matching product collections.",
    href: "/dashboard/curated-looks",
    icon: Camera,
    color: "bg-brand-tint text-brand border-transparent"
  },
  {
    title: "Styled Videos",
    description: "Update the shoppable video gallery and product tagging.",
    href: "/dashboard/styled-videos",
    icon: Video,
    color: "bg-brand-tint text-brand border-transparent"
  },
  {
    title: "Styled Video (Collection)",
    description: "Manage styled video galleries for specific collections.",
    href: "/dashboard/styled-videos-collection",
    icon: Layers,
    color: "bg-brand-tint text-brand border-transparent"
  },
  {
    title: "Clear Cache",
    description: "Clear Vercel cache for any page to instantly apply updates.",
    href: "/dashboard/revalidate",
    icon: RefreshCw,
    color: "bg-brand-tint text-brand border-transparent"
  },
  {
    title: "Hero Banners",
    description: "Manage homepage hero slider images, videos, and links.",
    href: "/dashboard/hero-banners",
    icon: Camera, // Reusing Camera since it's already imported
    color: "bg-brand-tint text-brand border-transparent"
  },
  {
    title: "Scheme Offer",
    description: "Manage promotional gifts, thresholds, and visibility for savings schemes.",
    href: "/dashboard/scheme-offer",
    icon: Gift,
    color: "bg-brand-tint text-brand border-transparent"
  }
];

/* Windows the summary tiles can report on. `days` counts back from today,
   `offset` shifts the window (used by "Yesterday"). */
const RANGES = [
  { key: 'today', label: 'Today', days: 1, offset: 0 },
  { key: 'yesterday', label: 'Yesterday', days: 1, offset: 1 },
  { key: '7d', label: '7 days', days: 7, offset: 0 },
  { key: '30d', label: '30 days', days: 30, offset: 0 },
];

function rangeDates(rangeKey) {
  const range = RANGES.find((r) => r.key === rangeKey) || RANGES[0];
  const end = subDays(new Date(), range.offset);
  const start = subDays(end, range.days - 1);
  return { start: format(start, 'yyyy-MM-dd'), end: format(end, 'yyyy-MM-dd') };
}

export default function Dashboard() {
  const [role, setRole] = useState(null);
  const [range, setRange] = useState('today');
  const [counts, setCounts] = useState({
    carts: { range: 0, total: 0 },
    orders: { range: 0, total: 0 },
    wishlists: { range: 0, total: 0 },
    activity: { range: 0, total: 0 }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setRole(localStorage.getItem('lucira_admin_role') || 'admin');
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function fetchSummaryCounts() {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';
        const { start, end } = rangeDates(range);
        const windowQs = `start_date=${start}&end_date=${end}`;

        // Fetch the selected window
        const [cartsRangeRes, ordersRangeRes, wishlistsRangeRes, activityRangeRes] = await Promise.all([
          fetch(`${baseUrl}/api/admin/carts?${windowQs}&limit=1&t=${Date.now()}`),
          fetch(`${baseUrl}/api/admin/orders?${windowQs}&limit=1&t=${Date.now()}`),
          fetch(`${baseUrl}/api/admin/wishlists?${windowQs}&t=${Date.now()}`),
          fetch(`${baseUrl}/api/admin/tracking?${windowQs}&t=${Date.now()}`)
        ]);

        // Fetch Total Data (No date filter)
        const [cartsTotalRes, ordersTotalRes, wishlistsTotalRes, activityTotalRes] = await Promise.all([
          fetch(`${baseUrl}/api/admin/carts?limit=1&t=${Date.now()}`),
          fetch(`${baseUrl}/api/admin/orders?limit=1&t=${Date.now()}`),
          fetch(`${baseUrl}/api/admin/wishlists?t=${Date.now()}`),
          fetch(`${baseUrl}/api/admin/tracking?t=${Date.now()}`)
        ]);

        const [
          cartsRange, ordersRange, wishlistsRange, activityRange,
          cartsTotal, ordersTotal, wishlistsTotal, activityTotal
        ] = await Promise.all([
          cartsRangeRes.json(), ordersRangeRes.json(), wishlistsRangeRes.json(), activityRangeRes.json(),
          cartsTotalRes.json(), ordersTotalRes.json(), wishlistsTotalRes.json(), activityTotalRes.json()
        ]);

        if (cancelled) return;

        setCounts({
          carts: {
            range: cartsRange.success ? (cartsRange.total !== undefined ? cartsRange.total : cartsRange.data.length) : 0,
            total: cartsTotal.success ? (cartsTotal.total !== undefined ? cartsTotal.total : cartsTotal.data.length) : 0
          },
          orders: {
            range: ordersRange.success ? (ordersRange.totalCount !== undefined ? ordersRange.totalCount : ordersRange.data.length) : 0,
            total: ordersTotal.success ? (ordersTotal.totalCount !== undefined ? ordersTotal.totalCount : ordersTotal.data.length) : 0
          },
          wishlists: {
            range: wishlistsRange.success ? wishlistsRange.data.length : 0,
            total: wishlistsTotal.success ? wishlistsTotal.data.length : 0
          },
          activity: {
            range: activityRange.success ? activityRange.data.length : 0,
            total: activityTotal.success ? activityTotal.data.length : 0
          }
        });
      } catch (err) {
        console.error('Failed to fetch summary counts:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchSummaryCounts();
    const interval = setInterval(fetchSummaryCounts, 60000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [range]);

  const filteredItems = DASHBOARD_ITEMS.filter(item => {
    if (!role) return false;
    if (role === 'admin') return true;
    if (role === 'marketing') {
      return ['/dashboard/revalidate', '/dashboard/update-rate', '/dashboard/curated-looks', '/dashboard/styled-videos', '/dashboard/styled-videos-collection'].includes(item.href);
    }
    if (role === 'cro') {
      return ['/dashboard/payments', '/dashboard/carts', '/dashboard/wishlists', '/dashboard/user-activity'].includes(item.href);
    }
    return false;
  });

  /* Summary tiles are driven entirely by the counts already fetched above;
     each is shown only when the current role can reach its detail page. */
  const visibleHrefs = new Set(filteredItems.map((item) => item.href));
  const summaryTiles = [
    { key: 'orders', label: 'Orders', icon: CreditCard, href: '/dashboard/payments', value: counts.orders },
    { key: 'carts', label: 'Abandoned Carts', icon: ShoppingCart, href: '/dashboard/carts', value: counts.carts },
    { key: 'wishlists', label: 'Wishlists', icon: Heart, href: '/dashboard/wishlists', value: counts.wishlists },
    { key: 'activity', label: 'User Activity', icon: Users, href: '/dashboard/user-activity', value: counts.activity },
  ].filter((tile) => visibleHrefs.has(tile.href));

  return (
    <div className="container-main py-10 px-4">
      <PageHeader
        icon={LayoutDashboard}
        title="Lucira Unified Backend"
        subtitle="Manage all custom services and promotional content from this unified interface."
        actions={<StatusPill tone="success" pulse>Connected to MongoDB Atlas</StatusPill>}
      />

      {summaryTiles.length > 0 && (
        <div className="mb-8">
          <div className="mb-3.5 flex flex-wrap items-center justify-between gap-3 px-1">
            <h2 className="admin-section-label">At a glance</h2>
            <div className="inline-flex items-center gap-1 rounded-xl bg-field p-1">
              {RANGES.map((r) => (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => setRange(r.key)}
                  aria-pressed={range === r.key}
                  className={`rounded-lg px-3 py-1.5 text-[12.5px] font-semibold transition-colors ${
                    range === r.key
                      ? 'bg-panel text-ink shadow-sm'
                      : 'text-ink-muted hover:text-ink'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div className="admin-panel grid grid-cols-1 divide-y divide-hairline-soft sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 [&>*:not(:first-child)]:sm:border-l [&>*]:sm:border-hairline-soft">
            {summaryTiles.map((tile) => (
              <Link
                key={tile.key}
                href={tile.href}
                prefetch={false}
                className="group flex items-center gap-4 px-6 py-6 transition-colors hover:bg-row-hover"
              >
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-tint text-brand transition-colors group-hover:bg-brand-tint-strong">
                  <tile.icon size={21} strokeWidth={1.9} />
                </span>
                <span className="min-w-0">
                  <span className="admin-eyebrow block">{tile.label}</span>
                  <span className="mt-1.5 block text-[26px] font-bold leading-none tracking-[-0.02em] text-ink">
                    {loading ? (
                      <span className="inline-block h-6 w-14 animate-pulse rounded-md bg-hairline-soft" />
                    ) : (
                      tile.value.range.toLocaleString()
                    )}
                  </span>
                  {!loading && (
                    <span className="mt-2 block text-[12px] font-medium text-ink-muted">
                      <span className="font-semibold text-ink">
                        {tile.value.total.toLocaleString()}
                      </span>{' '}
                      all time
                    </span>
                  )}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <h2 className="admin-section-label mb-3.5 px-1">All modules</h2>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {filteredItems.map((item) => (
          <Link
            key={item.title}
            href={item.href}
            prefetch={false}
            className="admin-panel group block p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-lifted"
          >
            <div className="mb-5 flex items-start justify-between">
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${item.color}`}>
                <item.icon size={22} strokeWidth={1.9} />
              </div>
              <ExternalLink
                size={15}
                className="mt-1 text-ink-muted transition-colors group-hover:text-[#5A413F]"
              />
            </div>
            <h3 className="flex items-center gap-2 text-[15.5px] font-bold tracking-[-0.01em] text-ink">
              {item.title}
              {item.isTracking && (
                <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-emerald-500" />
              )}
            </h3>
            <p className="mt-2 text-[13px] font-medium leading-relaxed text-ink-soft">
              {item.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
