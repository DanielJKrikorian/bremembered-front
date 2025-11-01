/*  src/pages/SearchResults.tsx  */
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Grid, List, SlidersHorizontal, MapPin, Star, Users,
  ChevronDown, Search, X, Camera, Video, Music, Calendar,
  Package, Building2, CheckCircle
} from 'lucide-react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { useAuth } from '../context/AuthContext';
import { trackPageView } from '../utils/analytics';
import { supabase } from '../lib/supabase';

interface Vendor {
  id: string;
  name: string;
  slug: string;
  profile?: string;
  profile_photo?: string;
  rating?: number;
  years_experience?: number;
  package_count: number;
  package_service_types: string[];
}

interface ServiceArea {
  id: string;
  state: string;
  region: string | null;
}

interface VendorServiceArea {
  vendor_id: string;
  service_area_id: string;
}

export const SearchResults: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { category } = useParams<{ category?: string }>();
  const { user, loading: authLoading } = useAuth();

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [serviceAreas, setServiceAreas] = useState<ServiceArea[]>([]);
  const [vendorServiceAreas, setVendorServiceAreas] = useState<VendorServiceArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'rating' | 'packages'>('rating');
  const [searchTerm, setSearchTerm] = useState('');
  const analyticsTracked = useRef(false);

  const [filters, setFilters] = useState({
    serviceTypes: [] as string[],
    state: '',
    areaId: '',
  });

  const EXCLUDED_SERVICE = 'Editing';

  /* ------------------- ANALYTICS ------------------- */
  useEffect(() => {
    if (!authLoading && !analyticsTracked.current) {
      const screen = category ? `search/vendors/${category}` : 'search/vendors';
      trackPageView(screen, 'bremembered.io', user?.id);
      analyticsTracked.current = true;
    }
  }, [authLoading, user?.id, category]);

  /* ------------------- FETCH ALL DATA ------------------- */
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: vendorData, error: vendorError } = await supabase
          .from('vendors')
          .select(`
            id, name, slug, profile, profile_photo, rating,
            years_experience,
            packages:service_packages!vendor_id(id, service_type)
          `);

        if (vendorError) throw vendorError;

        const { data: areaData, error: areaError } = await supabase
          .from('service_areas')
          .select('id, state, region');

        if (areaError) throw areaError;

        const { data: vsaData, error: vsaError } = await supabase
          .from('vendor_service_areas')
          .select('vendor_id, service_area_id');

        if (vsaError) throw vsaError;

        setServiceAreas(areaData || []);
        setVendorServiceAreas(vsaData || []);

        const vendorMap = new Map<string, Vendor>();

        vendorData.forEach(v => {
          const rawTypes = v.packages
            ?.map((p: any) => p.service_type)
            .filter(Boolean)
            .flatMap((type: string) => type.split(','))
            .map((t: string) => t.trim())
            .filter(Boolean) || [];

          const normalizedTypes = new Set(
            rawTypes.map(t => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase())
          );

          const visibleTypes = Array.from(normalizedTypes).filter(t => t !== EXCLUDED_SERVICE);
          const hasNonEditingPackage = visibleTypes.length > 0;

          if (!hasNonEditingPackage) return;

          vendorMap.set(v.id, {
            id: v.id,
            name: v.name,
            slug: v.slug,
            profile: v.profile,
            profile_photo: v.profile_photo,
            rating: v.rating,
            years_experience: v.years_experience,
            package_count: v.packages?.length || 0,
            package_service_types: visibleTypes,
          });
        });

        setVendors(Array.from(vendorMap.values()));
      } catch (err: any) {
        setError(err.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  /* ------------------- BUILD STATE → AREA MAP (UPPERCASE ABBREVIATIONS) ------------------- */
  const { states, areasByState } = useMemo(() => {
    const stateSet = new Set<string>();
    const areaMap = new Map<string, Map<string, string>>();

    serviceAreas.forEach(sa => {
      const rawState = sa.state?.trim();
      const rawRegion = sa.region?.trim();

      if (!rawState) return;

      // Force uppercase 2-letter abbreviation
      const stateAbbrev = rawState.toUpperCase().slice(0, 2);
      if (stateAbbrev.length !== 2) return; // Skip if not 2 letters

      stateSet.add(stateAbbrev);

      if (!areaMap.has(stateAbbrev)) {
        areaMap.set(stateAbbrev, new Map());
      }

      const regionPart = rawRegion ? rawRegion.trim() : '';
      const display = regionPart ? `${regionPart}, ${stateAbbrev}` : stateAbbrev;
      areaMap.get(stateAbbrev)!.set(display, sa.id);
    });

    return {
      states: Array.from(stateSet).sort(),
      areasByState: Object.fromEntries(
        Array.from(areaMap.entries()).map(([state, map]) => [
          state,
          Array.from(map.entries())
            .map(([display, id]) => ({ display, id }))
            .sort((a, b) => a.display.localeCompare(b.display)),
        ])
      ),
    };
  }, [serviceAreas]);

  /* ------------------- GET VENDOR IDS FOR AREA ------------------- */
  const allowedVendorIds = useMemo(() => {
    if (!filters.areaId) return null;

    const vsa = vendorServiceAreas.filter(vsa => vsa.service_area_id === filters.areaId);
    return new Set(vsa.map(vsa => vsa.vendor_id));
  }, [filters.areaId, vendorServiceAreas]);

  /* ------------------- FILTER VENDORS ------------------- */
  const filteredVendors = useMemo(() => {
    return vendors.filter(v => {
      if (searchTerm) {
        const low = searchTerm.toLowerCase();
        const matches =
          v.name.toLowerCase().includes(low) ||
          v.profile?.toLowerCase().includes(low) ||
          v.package_service_types.some(t => t.toLowerCase().includes(low));
        if (!matches) return false;
      }

      if (filters.serviceTypes.length > 0) {
        if (!v.package_service_types.some(t => filters.serviceTypes.includes(t))) return false;
      }

      if (filters.areaId) {
        if (!allowedVendorIds?.has(v.id)) return false;
      } else if (filters.state) {
        const stateUpper = filters.state.toUpperCase();
        const vendorVSAs = vendorServiceAreas.filter(vsa => vsa.vendor_id === v.id);
        const hasState = vendorVSAs.some(vsa => {
          const sa = serviceAreas.find(a => a.id === vsa.service_area_id);
          return sa?.state && sa.state.toUpperCase().includes(stateUpper);
        });
        if (!hasState) return false;
      }

      return true;
    });
  }, [vendors, searchTerm, filters, allowedVendorIds, vendorServiceAreas, serviceAreas]);

  /* ------------------- SORT ------------------- */
  const sortedVendors = useMemo(() => {
    const list = [...filteredVendors];
    switch (sortBy) {
      case 'name': return list.sort((a, b) => a.name.localeCompare(b.name));
      case 'rating': return list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      case 'packages': return list.sort((a, b) => b.package_count - a.package_count);
      default: return list;
    }
  }, [filteredVendors, sortBy]);

  /* ------------------- SERVICE TYPE OPTIONS ------------------- */
  const serviceTypeOptions = [
    { value: 'Photography', label: 'Photography', icon: Camera },
    { value: 'Videography', label: 'Videography', icon: Video },
    { value: 'Dj Services', label: 'DJ Services', icon: Music },
    { value: 'Live Musician', label: 'Live Musician', icon: Music },
    { value: 'Coordination', label: 'Day-of Coordination', icon: Users },
    { value: 'Planning', label: 'Planning', icon: Calendar },
    { value: 'Venues', label: 'Venues', icon: Building2 },
    { value: 'Catering', label: 'Catering', icon: Package },
    { value: 'Florist', label: 'Florist', icon: Package },
    { value: 'Photo Booth', label: 'Photo Booth', icon: Camera },
    { value: 'Rentals', label: 'Rentals', icon: Package },
    { value: 'Officiant', label: 'Officiant', icon: Users },
    { value: 'Transportation', label: 'Transportation', icon: Package },
    { value: 'Hair & Makeup', label: 'Hair & Makeup', icon: Package },
    { value: 'Cake & Desserts', label: 'Cake & Desserts', icon: Package },
  ];

  const handleServiceToggle = (val: string) => {
    setFilters(p => ({
      ...p,
      serviceTypes: p.serviceTypes.includes(val)
        ? p.serviceTypes.filter(v => v !== val)
        : [...p.serviceTypes, val]
    }));
  };

  const handleStateChange = (state: string) => {
    setFilters(p => ({ ...p, state, areaId: '' }));
  };

  const handleAreaChange = (areaId: string) => {
    setFilters(p => ({ ...p, areaId }));
  };

  const clearFilters = () => {
    setFilters({ serviceTypes: [], state: '', areaId: '' });
    setSearchTerm('');
  };

  const getVendorPhoto = (v: Vendor) =>
    v.profile_photo ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(v.name)}&background=f3f4f6&color=374151&size=256`;

  const activeFiltersCount = filters.serviceTypes.length + (filters.state ? 1 : 0) + (filters.areaId ? 1 : 0);

  /* ------------------- LOADING ------------------- */
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full mx-auto mb-4"/>
          <p className="text-gray-600">Loading vendors…</p>
        </div>
      </div>
    );
  }

  /* ------------------- ERROR ------------------- */
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <p className="text-red-600 mb-4">Error: {error}</p>
          <Button variant="primary" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  /* ------------------- GRID CARD (ROSE OUTLINE ON CARD + PHOTO) ------------------- */
const VendorGridCard = ({ v }: { v: Vendor }) => (
  <Card
    className="group overflow-hidden rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer bg-white border-2 border-transparent hover:border-rose-500"
    onClick={() => navigate(`/vendor/${v.slug}`)}
  >
    <div className="p-6 flex justify-center">
      <div className="relative">
        <img
          src={getVendorPhoto(v)}
          alt={v.name}
          className="w-32 h-32 object-cover rounded-full ring-4 ring-rose-200 ring-offset-4 ring-offset-white shadow-lg group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1.5 rounded-full shadow-md">
          <CheckCircle className="w-4 h-4" />
        </div>
      </div>
    </div>

    <div className="px-6 pb-6">
      <h3 className="text-xl font-bold text-gray-900 text-center mb-1 group-hover:text-rose-600 transition-colors">
        {v.name}
      </h3>

      {v.rating && (
        <div className="flex items-center justify-center gap-1 mb-3">
          <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
          <span className="text-sm font-semibold text-amber-900">{v.rating}</span>
        </div>
      )}

      <p className="text-gray-600 text-sm text-center line-clamp-3 mb-4 min-h-[3.5rem]">
        {v.profile || 'Professional wedding vendor'}
      </p>

      <div className="flex flex-wrap gap-3 justify-center mb-4">
        {(v.package_service_types || []).map(t => {
          const option = serviceTypeOptions.find(o => o.value.toLowerCase() === t.toLowerCase());
          const Icon = option?.icon || Package;
          return (
            <div
              key={`${v.id}-${t}`}
              className="p-2 rounded-full bg-rose-50 text-rose-700 shadow-sm hover:bg-rose-100 transition-colors"
              title={t}
            >
              <Icon className="w-5 h-5" />
            </div>
          );
        })}
      </div>

      <Button
        variant="primary"
        className="w-full bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-medium py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all"
        onClick={e => { e.stopPropagation(); navigate(`/vendor/${v.slug}`); }}
      >
        View Profile
      </Button>
    </div>
  </Card>
);

/* ------------------- LIST CARD (ROSE OUTLINE ON CARD + PHOTO) ------------------- */
const VendorListItem = ({ v }: { v: Vendor }) => (
  <Card
    className="group flex gap-8 p-6 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer bg-white relative border-2 border-transparent hover:border-rose-500"
    onClick={() => navigate(`/vendor/${v.slug}`)}
  >
    <div className="relative flex-shrink-0">
      <img
        src={getVendorPhoto(v)}
        alt={v.name}
        className="w-40 h-40 object-cover rounded-full ring-4 ring-rose-200 ring-offset-4 ring-offset-white shadow-lg group-hover:scale-105 transition-transform"
      />
      <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1.5 rounded-full shadow-md">
        <CheckCircle className="w-5 h-5" />
      </div>
    </div>

    <div className="flex-1 flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="text-xl font-bold text-gray-900 group-hover:text-rose-600 transition-colors">
              {v.name}
            </h3>
          </div>
          {v.rating && (
            <div className="flex items-center gap-1 bg-amber-50 px-3 py-1.5 rounded-full">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span className="text-sm font-semibold text-amber-900">{v.rating}</span>
            </div>
          )}
        </div>

        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
          {v.profile || 'Professional wedding vendor'}
        </p>

        <div className="flex flex-wrap gap-3">
          {(v.package_service_types || []).map(t => {
            const option = serviceTypeOptions.find(o => o.value.toLowerCase() === t.toLowerCase());
            const Icon = option?.icon || Package;
            return (
              <div
                key={`${v.id}-${t}`}
                className="p-2.5 rounded-full bg-rose-50 text-rose-700 shadow-sm hover:bg-rose-100 transition-colors"
                title={t}
              >
                <Icon className="w-5 h-5" />
              </div>
            );
          })}
        </div>
      </div>

      <div className="absolute bottom-6 right-6">
        <Button
          variant="primary"
          className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-medium px-6 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all"
          onClick={e => { e.stopPropagation(); navigate(`/vendor/${v.slug}`); }}
        >
          View Profile
        </Button>
      </div>
    </div>
  </Card>
);

  /* ------------------- MAIN UI ------------------- */
  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* HEADER */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Find Your Perfect Wedding Team
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover top-rated vendors with real packages and verified reviews
          </p>
        </div>

        {/* SEARCH BAR */}
        <Card className="p-6 mb-10 shadow-lg rounded-2xl bg-white/80 backdrop-blur">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"/>
              <Input
                placeholder="Search by name, service, or location..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-12 pr-4 py-3 text-lg border-gray-200 focus:border-rose-400 focus:ring-rose-400"
              />
            </div>
            <div className="md:hidden">
              <Button variant="outline" icon={SlidersHorizontal} onClick={() => setShowFilters(!showFilters)}>
                Filters {activeFiltersCount ? `(${activeFiltersCount})` : ''}
              </Button>
            </div>
          </div>

          {/* MOBILE FILTERS */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">State</label>
                  <select
                    value={filters.state}
                    onChange={e => handleStateChange(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="">All States</option>
                    {states.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                {filters.state && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Area</label>
                    <select
                      value={filters.areaId}
                      onChange={e => handleAreaChange(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                    >
                      <option value="">All Areas in {filters.state}</option>
                      {areasByState[filters.state]?.map(({ display, id }) => (
                        <option key={id} value={id}>{display}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Service Types</label>
                  <div className="space-y-3">
                    {serviceTypeOptions.map(o => (
                      <label key={o.value} className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.serviceTypes.includes(o.value)}
                          onChange={() => handleServiceToggle(o.value)}
                          className="sr-only"
                        />
                        <div className={`flex items-center gap-3 px-4 py-2 rounded-xl transition-all w-full ${
                          filters.serviceTypes.includes(o.value)
                            ? 'bg-rose-100 text-rose-700 ring-2 ring-rose-500'
                            : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                        }`}>
                          <o.icon className="w-5 h-5" />
                          <span className="text-sm font-medium">{o.label}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center mt-6">
                <button onClick={clearFilters} className="text-sm font-medium text-rose-600 hover:text-rose-700">
                  Clear all
                </button>
                <Button variant="outline" onClick={() => setShowFilters(false)}>
                  Apply Filters
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* RESULTS HEADER */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {sortedVendors.length} {sortedVendors.length === 1 ? 'Vendor' : 'Vendors'} Found
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {/* Sort */}
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as 'name' | 'rating' | 'packages')}
              className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              <option value="rating">Highest Rated</option>
              <option value="name">Name: A to Z</option>
              <option value="packages">Most Packages</option>
            </select>

            {/* State Dropdown (UPPERCASE) */}
            <select
              value={filters.state}
              onChange={e => handleStateChange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              <option value="">All States</option>
              {states.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            {/* Area Dropdown */}
            {filters.state && (
              <select
                value={filters.areaId}
                onChange={e => handleAreaChange(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <option value="">All Areas</option>
                {areasByState[filters.state]?.map(({ display, id }) => (
                  <option key={id} value={id}>{display}</option>
                ))}
              </select>
            )}

            {/* View Toggle */}
            <div className="flex border border-gray-300 rounded-xl overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2.5 ${viewMode === 'grid' ? 'bg-rose-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              >
                <Grid className="w-4 h-4"/>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2.5 ${viewMode === 'list' ? 'bg-rose-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              >
                <List className="w-4 h-4"/>
              </button>
            </div>
          </div>
        </div>

        {/* LAYOUT */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* DESKTOP FILTERS */}
          <div className="lg:w-80 hidden lg:block">
            <Card className="p-6 sticky top-6 rounded-2xl shadow-md bg-white/90 backdrop-blur">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">Filters</h3>
                <button onClick={clearFilters} className="text-sm font-medium text-rose-600 hover:text-rose-700">
                  Clear all
                </button>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">State</label>
                  <select
                    value={filters.state}
                    onChange={e => handleStateChange(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="">All States</option>
                    {states.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                {filters.state && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Area</label>
                    <select
                      value={filters.areaId}
                      onChange={e => handleAreaChange(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                    >
                      <option value="">All Areas in {filters.state}</option>
                      {areasByState[filters.state]?.map(({ display, id }) => (
                        <option key={id} value={id}>{display}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Service Types</label>
                  <div className="space-y-3">
                    {serviceTypeOptions.map(o => (
                      <label key={o.value} className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.serviceTypes.includes(o.value)}
                          onChange={() => handleServiceToggle(o.value)}
                          className="sr-only"
                        />
                        <div className={`flex items-center gap-3 px-4 py-2 rounded-xl transition-all w-full ${
                          filters.serviceTypes.includes(o.value)
                            ? 'bg-rose-100 text-rose-700 ring-2 ring-rose-500'
                            : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                        }`}>
                          <o.icon className="w-5 h-5" />
                          <span className="text-sm font-medium">{o.label}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* RESULTS */}
          <div className="flex-1">
            {sortedVendors.length === 0 ? (
              <Card className="p-16 text-center rounded-2xl bg-white/80 backdrop-blur">
                <Users className="w-20 h-20 text-gray-300 mx-auto mb-6"/>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">No vendors found</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  {searchTerm || activeFiltersCount 
                    ? 'Try adjusting your search or filters to see more results.' 
                    : 'No vendors match your criteria yet.'}
                </p>
                {(searchTerm || activeFiltersCount) && (
                  <Button variant="primary" onClick={clearFilters} className="bg-rose-500 hover:bg-rose-600">
                    Clear Filters
                  </Button>
                )}
              </Card>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {sortedVendors.map(v => <VendorGridCard key={v.id} v={v} />)}
              </div>
            ) : (
              <div className="space-y-8">
                {sortedVendors.map(v => <VendorListItem key={v.id} v={v} />)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(SearchResults);