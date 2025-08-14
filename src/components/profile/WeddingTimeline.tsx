import React, { useState, useEffect, useRef } from 'react';
import { Plus, Clock, MapPin, Calendar, X, Edit2, ChevronDown, ChevronUp, AlertCircle, Check, Download, FileDown, FileText, Share2, Music, Users } from 'lucide-react';
import { format, parseISO, addMinutes } from 'date-fns';
import { jsPDF } from 'jspdf';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useCouple } from '../../hooks/useCouple';

interface TimelineEvent {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  event_time: string;
  location: string | null;
  type: string;
  duration_minutes?: number;
  is_standard?: boolean;
  music_notes?: string;
  playlist_requests?: string;
}

interface EventFormData {
  title: string;
  description: string;
  event_date: string;
  event_time: string;
  location: string;
  type: string;
  duration_minutes: number;
  music_notes: string;
  playlist_requests: string;
}

interface StandardEvent {
  type: string;
  title: string;
  description: string;
  duration_minutes: number;
  order: number;
}

interface Vendor {
  id: string;
  name: string;
}

const eventTypes = [
  { value: "custom", label: "Custom Event" },
  { value: "getting_ready", label: "Getting Ready" },
  { value: "first_look", label: "First Look" },
  { value: "ceremony", label: "Ceremony" },
  { value: "cocktail_hour", label: "Cocktail Hour" },
  { value: "reception_entrance", label: "Reception Entrance" },
  { value: "first_dance", label: "First Dance" },
  { value: "dinner", label: "Dinner" },
  { value: "toasts", label: "Toasts & Speeches" },
  { value: "cake_cutting", label: "Cake Cutting" },
  { value: "parent_dances", label: "Parent Dances" },
  { value: "open_dancing", label: "Open Dancing" },
  { value: "bouquet_toss", label: "Bouquet & Garter Toss" },
  { value: "send_off", label: "Grand Send-Off" },
  { value: "photo_session", label: "Photo Session" },
  { value: "transportation", label: "Transportation" },
  { value: "vendor_arrival", label: "Vendor Arrival" },
  { value: "other", label: "Other" },
];

const standardEvents: StandardEvent[] = [
  {
    type: "getting_ready",
    title: "Getting Ready",
    description: "Hair, makeup, and final preparations",
    duration_minutes: 120,
    order: 1,
  },
  {
    type: "first_look",
    title: "First Look",
    description: "Private moment seeing each other before the ceremony",
    duration_minutes: 30,
    order: 2,
  },
  {
    type: "ceremony",
    title: "Ceremony",
    description: "Wedding ceremony",
    duration_minutes: 60,
    order: 3,
  },
  {
    type: "cocktail_hour",
    title: "Cocktail Hour",
    description: "Drinks and appetizers for guests",
    duration_minutes: 60,
    order: 4,
  },
  {
    type: "reception_entrance",
    title: "Grand Entrance",
    description: "Introduction of the wedding party and newlyweds",
    duration_minutes: 15,
    order: 5,
  },
  {
    type: "first_dance",
    title: "First Dance",
    description: "First dance as a married couple",
    duration_minutes: 10,
    order: 6,
  },
  {
    type: "dinner",
    title: "Dinner Service",
    description: "Meal service for all guests",
    duration_minutes: 60,
    order: 7,
  },
  {
    type: "toasts",
    title: "Toasts & Speeches",
    description: "Speeches from wedding party and family",
    duration_minutes: 30,
    order: 8,
  },
  {
    type: "cake_cutting",
    title: "Cake Cutting",
    description: "Ceremonial cutting of the wedding cake",
    duration_minutes: 15,
    order: 9,
  },
  {
    type: "parent_dances",
    title: "Parent Dances",
    description: "Special dances with parents",
    duration_minutes: 15,
    order: 10,
  },
  {
    type: "open_dancing",
    title: "Open Dancing",
    description: "Dance floor opens for all guests",
    duration_minutes: 120,
    order: 11,
  },
  {
    type: "bouquet_toss",
    title: "Bouquet & Garter Toss",
    description: "Traditional bouquet and garter toss",
    duration_minutes: 15,
    order: 12,
  },
  {
    type: "send_off",
    title: "Grand Send-Off",
    description: "Final farewell as you depart the reception",
    duration_minutes: 15,
    order: 13,
  },
];

export const WeddingTimeline: React.FC = () => {
  const { user } = useAuth();
  const { couple } = useCouple();
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [editingEvent, setEditingEvent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [weddingDate, setWeddingDate] = useState<string>("");
  const [showStandardEvents, setShowStandardEvents] = useState(false);
  const [standardEventsAdded, setStandardEventsAdded] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<string>("");
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const downloadMenuRef = useRef<HTMLDivElement>(null);

  const defaultEventState: EventFormData = {
    title: "",
    description: "",
    event_date: "",
    event_time: "",
    location: "",
    type: "custom",
    duration_minutes: 60,
    music_notes: "",
    playlist_requests: "",
  };

  const [formData, setFormData] = useState<EventFormData>(defaultEventState);

  useEffect(() => {
    if (couple) {
      setWeddingDate(couple.wedding_date || '');
      fetchEvents();
      fetchVendors();
    }
  }, [couple]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        downloadMenuRef.current &&
        !downloadMenuRef.current.contains(event.target as Node)
      ) {
        setShowDownloadMenu(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fetchEvents = async () => {
    if (!couple?.id || !supabase || !isSupabaseConfigured()) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("timeline_events")
        .select("*")
        .eq("couple_id", couple.id)
        .order("event_date", { ascending: true })
        .order("event_time", { ascending: true });

      if (error) throw error;

      setEvents(data || []);

      const hasStandardEvents = data?.some(
        (event) => event.type === "ceremony" || event.type === "first_dance"
      );
      setStandardEventsAdded(hasStandardEvents || false);

      if (couple.wedding_date && !formData.event_date) {
        setFormData((prev) => ({
          ...prev,
          event_date: couple.wedding_date,
        }));
      }
    } catch (error) {
      console.error("Error fetching events:", error);
      setError("Failed to load timeline events");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchVendors = async () => {
    if (!couple?.id || !supabase || !isSupabaseConfigured()) {
      return;
    }

    try {
      const { data, error } = await supabase
        .from("bookings")
        .select("vendors(id, name)")
        .eq("couple_id", couple.id);

      if (error) throw error;

      const uniqueVendors = Array.from(
        new Map(data?.map((v: any) => [v.vendors.id, v.vendors])).values()
      );
      setVendors(uniqueVendors as Vendor[]);
    } catch (error) {
      console.error("Error fetching vendors:", error);
    }
  };

  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    if (!formData.title.trim()) {
      errors.title = "Title is required";
    }
    if (!formData.event_date) {
      errors.event_date = "Date is required";
    }
    if (!formData.event_time) {
      errors.event_time = "Time is required";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (formErrors[name]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedType = e.target.value;

    const standardEvent = standardEvents.find(
      (event) => event.type === selectedType
    );

    if (standardEvent) {
      setFormData((prev) => ({
        ...prev,
        type: selectedType,
        title: standardEvent.title,
        description: standardEvent.description,
        duration_minutes: standardEvent.duration_minutes,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        type: selectedType,
      }));
    }
  };

  const handleAddEvent = async () => {
    if (!user || !couple || !supabase || !isSupabaseConfigured()) return;

    if (!validateForm()) {
      return;
    }

    try {
      const eventData = {
        ...formData,
        couple_id: couple.id,
        is_standard: formData.type !== "custom" && formData.type !== "other",
      };

      const { error } = await supabase
        .from("timeline_events")
        .insert([eventData]);

      if (error) throw error;

      setIsAddingEvent(false);
      setFormData(defaultEventState);
      setFormErrors({});
      fetchEvents();
      setSuccessMessage("Event added successfully");

      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (error) {
      console.error("Error adding event:", error);
      setError("Failed to add event");
    }
  };

  const handleUpdateEvent = async (eventId: string) => {
    if (!supabase || !isSupabaseConfigured()) return;

    if (!validateForm()) {
      return;
    }

    try {
      const { error } = await supabase
        .from("timeline_events")
        .update(formData)
        .eq("id", eventId);

      if (error) throw error;

      setEditingEvent(null);
      setFormData(defaultEventState);
      setFormErrors({});
      fetchEvents();
      setSuccessMessage("Event updated successfully");

      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (error) {
      console.error("Error updating event:", error);
      setError("Failed to update event");
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!supabase || !isSupabaseConfigured()) return;

    try {
      const { error } = await supabase
        .from("timeline_events")
        .delete()
        .eq("id", eventId);

      if (error) throw error;

      fetchEvents();
      setSuccessMessage("Event deleted successfully");

      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (error) {
      console.error("Error deleting event:", error);
      setError("Failed to delete event");
    }
  };

  const startEditing = (event: TimelineEvent) => {
    setEditingEvent(event.id);
    setFormData({
      title: event.title,
      description: event.description || "",
      event_date: event.event_date,
      event_time: event.event_time,
      location: event.location || "",
      type: event.type,
      duration_minutes: event.duration_minutes || 60,
      music_notes: event.music_notes || "",
      playlist_requests: event.playlist_requests || "",
    });
    setFormErrors({});
  };

  const cancelForm = () => {
    setIsAddingEvent(false);
    setEditingEvent(null);
    setFormData(defaultEventState);
    setFormErrors({});
  };

  const addStandardEvents = async () => {
    if (!couple || !weddingDate || !supabase || !isSupabaseConfigured()) {
      setError("Please set your wedding date first");
      return;
    }

    try {
      let currentTime = new Date(`${weddingDate}T12:00:00`);

      const ceremonyEvent = events.find((e) => e.type === "ceremony");
      if (ceremonyEvent) {
        currentTime = new Date(
          `${ceremonyEvent.event_date}T${ceremonyEvent.event_time}`
        );
      }

      const standardEventsToAdd = standardEvents
        .filter((stdEvent) => !events.some((e) => e.type === stdEvent.type))
        .map((stdEvent) => {
          if (stdEvent.order < 3 && ceremonyEvent) {
            const ceremonyTime = new Date(
              `${ceremonyEvent.event_date}T${ceremonyEvent.event_time}`
            );
            let eventTime;

            if (stdEvent.type === "getting_ready") {
              eventTime = new Date(ceremonyTime);
              eventTime.setHours(eventTime.getHours() - 3);
            } else if (stdEvent.type === "first_look") {
              eventTime = new Date(ceremonyTime);
              eventTime.setHours(eventTime.getHours() - 1);
            }

            return {
              couple_id: couple.id,
              title: stdEvent.title,
              description: stdEvent.description,
              event_date: weddingDate,
              event_time: format(eventTime || currentTime, "HH:mm"),
              type: stdEvent.type,
              duration_minutes: stdEvent.duration_minutes,
              is_standard: true,
            };
          }

          if (stdEvent.order > 3 || !ceremonyEvent) {
            const eventData = {
              couple_id: couple.id,
              title: stdEvent.title,
              description: stdEvent.description,
              event_date: weddingDate,
              event_time: format(currentTime, "HH:mm"),
              type: stdEvent.type,
              duration_minutes: stdEvent.duration_minutes,
              is_standard: true,
            };

            currentTime = addMinutes(currentTime, stdEvent.duration_minutes);

            return eventData;
          }

          return null;
        })
        .filter(Boolean);

      if (standardEventsToAdd.length === 0) {
        setError("All standard events have already been added");
        return;
      }

      const { error } = await supabase
        .from("timeline_events")
        .insert(standardEventsToAdd);

      if (error) throw error;

      fetchEvents();
      setStandardEventsAdded(true);
      setShowStandardEvents(false);
      setSuccessMessage("Standard events added successfully");

      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (error) {
      console.error("Error adding standard events:", error);
      setError("Failed to add standard events");
    }
  };

  const addSingleStandardEvent = async (event: StandardEvent) => {
    if (!couple || !weddingDate || !supabase || !isSupabaseConfigured()) {
      setError("Please set your wedding date first");
      return;
    }

    try {
      let eventTime = new Date(`${weddingDate}T12:00:00`);

      const ceremonyEvent = events.find((e) => e.type === "ceremony");
      if (ceremonyEvent) {
        const ceremonyTime = new Date(
          `${ceremonyEvent.event_date}T${ceremonyEvent.event_time}`
        );

        if (event.order < 3) {
          if (event.type === "getting_ready") {
            eventTime = new Date(ceremonyTime);
            eventTime.setHours(eventTime.getHours() - 3);
          } else if (event.type === "first_look") {
            eventTime = new Date(ceremonyTime);
            eventTime.setHours(eventTime.getHours() - 1);
          }
        } else if (event.order > 3) {
          const sortedEvents = [...events].sort((a, b) => {
            const dateA = new Date(`${a.event_date}T${a.event_time}`);
            const dateB = new Date(`${b.event_date}T${b.event_time}`);
            return dateB.getTime() - dateA.getTime();
          });

          if (sortedEvents.length > 0) {
            const lastEvent = sortedEvents[0];
            const lastEventTime = new Date(
              `${lastEvent.event_date}T${lastEvent.event_time}`
            );

            if (lastEvent.duration_minutes) {
              lastEventTime.setMinutes(
                lastEventTime.getMinutes() + lastEvent.duration_minutes
              );
            }

            eventTime = lastEventTime;
          } else {
            eventTime = new Date(ceremonyTime);
            eventTime.setMinutes(eventTime.getMinutes() + 30);
          }
        } else {
          eventTime = ceremonyTime;
        }
      }

      const eventData = {
        couple_id: couple.id,
        title: event.title,
        description: event.description,
        event_date: weddingDate,
        event_time: format(eventTime, "HH:mm"),
        type: event.type,
        duration_minutes: event.duration_minutes,
        is_standard: true,
      };

      const { error } = await supabase
        .from("timeline_events")
        .insert([eventData]);

      if (error) throw error;

      fetchEvents();
      setSuccessMessage(`Added ${event.title} to your timeline`);

      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (error) {
      console.error("Error adding standard event:", error);
      setError("Failed to add event");
    }
  };

  const handleShareWithVendor = async () => {
    if (!selectedVendor || !couple || !supabase || !isSupabaseConfigured()) {
      setError("Please select a vendor to share with");
      return;
    }

    setIsSharing(true);
    try {
      const token = crypto.randomUUID();
      const { error } = await supabase.from("timeline_shares").insert({
        couple_id: couple.id,
        vendor_id: selectedVendor,
        status: "active",
        token,
      });

      if (error) throw error;

      const shareUrl = `${window.location.origin}/vendor/timeline?token=${token}`;
      setShareLink(shareUrl);
      setSuccessMessage("Timeline shared successfully! Copy the link below.");

      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
    } catch (error) {
      console.error("Error sharing timeline:", error);
      setError("Failed to share timeline");
    } finally {
      setIsSharing(false);
    }
  };

  const handleDownloadTimelinePDF = () => {
    if (events.length === 0) {
      setError("No events to download");
      return;
    }

    setIsDownloading(true);

    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.text("WEDDING TIMELINE", 105, 20, { align: "center" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(14);
      doc.text(couple?.name || "Wedding Timeline", 105, 30, { align: "center" });

      doc.setFontSize(12);
      let yPos = 40;

      if (couple?.wedding_date) {
        doc.text(
          `Date: ${format(parseISO(couple.wedding_date), "MMMM d, yyyy")}`,
          105,
          yPos,
          { align: "center" }
        );
        yPos += 7;
      }

      if (couple?.venue_name) {
        doc.text(`Venue: ${couple.venue_name}`, 105, yPos, {
          align: "center",
        });
        yPos += 7;
      }

      doc.setFont("helvetica", "bold");
      doc.text("SCHEDULE", 20, yPos + 10);
      yPos += 15;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);

      events.forEach((event) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }

        const eventTime = format(
          parseISO(`2000-01-01T${event.event_time}`),
          "h:mm a"
        );
        const endTime = event.duration_minutes
          ? format(
              addMinutes(
                parseISO(`2000-01-01T${event.event_time}`),
                event.duration_minutes
              ),
              "h:mm a"
            )
          : null;

        doc.setFont("helvetica", "bold");
        doc.text(
          `${eventTime}${endTime ? ` - ${endTime}` : ""}: ${event.title}`,
          20,
          yPos
        );
        yPos += 6;

        if (event.description) {
          doc.setFont("helvetica", "normal");
          const descriptionLines = doc.splitTextToSize(event.description, 170);
          doc.text(descriptionLines, 25, yPos);
          yPos += 6 * descriptionLines.length;
        }

        if (event.location) {
          doc.setFont("helvetica", "normal");
          doc.text(`Location: ${event.location}`, 25, yPos);
          yPos += 6;
        }

        if (event.music_notes) {
          doc.setFont("helvetica", "normal");
          doc.text(`Music: ${event.music_notes}`, 25, yPos);
          yPos += 6;
        }

        if (event.duration_minutes) {
          doc.setFont("helvetica", "normal");
          doc.text(`Duration: ${event.duration_minutes} minutes`, 25, yPos);
          yPos += 6;
        }

        yPos += 4;
      });

      doc.save(`Wedding_Timeline_${format(new Date(), "yyyy-MM-dd")}.pdf`);

      setSuccessMessage("Timeline downloaded as PDF successfully");

      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (error) {
      console.error("Error downloading timeline as PDF:", error);
      setError("Failed to download timeline as PDF");
    } finally {
      setIsDownloading(false);
      setShowDownloadMenu(false);
    }
  };

  const calculateTimeDifference = (
    currentEvent: TimelineEvent,
    nextEvent: TimelineEvent
  ) => {
    const currentDateTime = new Date(
      `${currentEvent.event_date}T${currentEvent.event_time}`
    );
    const nextDateTime = new Date(
      `${nextEvent.event_date}T${nextEvent.event_time}`
    );

    if (currentEvent.duration_minutes) {
      currentDateTime.setMinutes(
        currentDateTime.getMinutes() + currentEvent.duration_minutes
      );
    }

    const diffMinutes = Math.round(
      (nextDateTime.getTime() - currentDateTime.getTime()) / (1000 * 60)
    );

    if (diffMinutes < 0) {
      return (
        <span className="text-red-500">
          Warning: Events overlap by {Math.abs(diffMinutes)} minutes
        </span>
      );
    } else if (diffMinutes === 0) {
      return <span>Next event starts immediately</span>;
    } else if (diffMinutes < 60) {
      return <span>{diffMinutes} minute break</span>;
    } else {
      const hours = Math.floor(diffMinutes / 60);
      const minutes = diffMinutes % 60;
      return (
        <span>
          {hours} hour{hours !== 1 ? "s" : ""}
          {minutes > 0
            ? ` ${minutes} minute${minutes !== 1 ? "s" : ""}`
            : ""}{" "}
          break
        </span>
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Success/Error Messages */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
          <Check className="h-5 w-5 text-green-500 mr-2" />
          <p className="text-green-700">{successMessage}</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
          <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Wedding Date Section */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Wedding Date</h3>
        <div className="flex flex-col md:flex-row md:items-end gap-4">
          <div className="flex-grow">
            <Input
              label="Set Your Wedding Date"
              type="date"
              value={weddingDate}
              onChange={(e) => setWeddingDate(e.target.value)}
              icon={Calendar}
            />
          </div>
          <Button
            variant="primary"
            onClick={async () => {
              if (!weddingDate || !couple || !supabase || !isSupabaseConfigured()) {
                setError("Please select a wedding date");
                return;
              }

              try {
                const { error } = await supabase
                  .from("couples")
                  .update({ wedding_date: weddingDate })
                  .eq("id", couple.id);

                if (error) throw error;

                setFormData((prev) => ({
                  ...prev,
                  event_date: weddingDate,
                }));

                setSuccessMessage("Wedding date updated successfully");

                setTimeout(() => {
                  setSuccessMessage(null);
                }, 3000);
              } catch (error) {
                console.error("Error updating wedding date:", error);
                setError("Failed to update wedding date");
              }
            }}
          >
            Update Date
          </Button>
        </div>

        {couple?.venue_name && (
          <div className="mt-4 flex items-center text-gray-600">
            <MapPin className="h-5 w-5 mr-2" />
            <span>{couple.venue_name}</span>
            {couple.venue_street_address && (
              <span className="ml-1">({couple.venue_street_address})</span>
            )}
          </div>
        )}
      </Card>

      {/* Timeline Header */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Wedding Timeline</h3>
            <p className="text-gray-600 mt-1">Plan and organize your wedding day events</p>
          </div>
          <div className="flex space-x-3">
            <div className="relative" ref={downloadMenuRef}>
              <Button
                variant="outline"
                icon={Download}
                onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                disabled={events.length === 0 || isDownloading}
              >
                Download
                {showDownloadMenu ? (
                  <ChevronUp className="h-4 w-4 ml-2" />
                ) : (
                  <ChevronDown className="h-4 w-4 ml-2" />
                )}
              </Button>

              {showDownloadMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                  <div className="py-1">
                    <button
                      onClick={handleDownloadTimelinePDF}
                      disabled={events.length === 0 || isDownloading}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    >
                      <FileDown className="h-4 w-4 mr-2" />
                      Download as PDF
                    </button>
                    <button
                      onClick={() => {
                        // CSV download logic here
                        setShowDownloadMenu(false);
                      }}
                      disabled={events.length === 0 || isDownloading}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Download as CSV
                    </button>
                  </div>
                </div>
              )}
            </div>

            <Button
              variant="outline"
              icon={showStandardEvents ? ChevronUp : ChevronDown}
              onClick={() => setShowStandardEvents(!showStandardEvents)}
            >
              {showStandardEvents ? "Hide" : "Add"} Standard Events
            </Button>

            <Button
              variant="primary"
              icon={Plus}
              onClick={() => setIsAddingEvent(true)}
            >
              Add Custom Event
            </Button>
          </div>
        </div>

        {/* Share with Vendor Section */}
        <div className="border-t pt-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Share Timeline with Vendor</h4>
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-grow">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Vendor
              </label>
              <select
                value={selectedVendor}
                onChange={(e) => setSelectedVendor(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <option value="">Select a vendor</option>
                {vendors.map((vendor) => (
                  <option key={vendor.id} value={vendor.id}>
                    {vendor.name}
                  </option>
                ))}
              </select>
            </div>
            <Button
              variant="primary"
              icon={Share2}
              onClick={handleShareWithVendor}
              disabled={!selectedVendor || isSharing}
              loading={isSharing}
            >
              Share Timeline
            </Button>
          </div>
          {shareLink && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-700 mb-2">
                Share this link with the vendor:
              </p>
              <div className="flex items-center">
                <input
                  type="text"
                  value={shareLink}
                  readOnly
                  className="flex-grow p-2 rounded-l-lg border border-gray-300 bg-white text-sm"
                />
                <Button
                  variant="primary"
                  onClick={() => {
                    navigator.clipboard.writeText(shareLink);
                    setSuccessMessage("Link copied to clipboard!");
                    setTimeout(() => setSuccessMessage(null), 3000);
                  }}
                  className="rounded-l-none"
                >
                  Copy
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Standard Events */}
      {showStandardEvents && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">Standard Wedding Events</h3>
            <Button
              variant="primary"
              icon={Plus}
              onClick={addStandardEvents}
              disabled={!weddingDate}
            >
              Add All Standard Events
            </Button>
          </div>

          {!weddingDate && (
            <div className="bg-yellow-50 p-4 rounded-lg mb-6 flex items-start border border-yellow-200">
              <AlertCircle className="h-5 w-5 text-yellow-500 mr-2 mt-0.5" />
              <p className="text-yellow-700">
                Please set your wedding date first to add standard events.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {standardEvents.map((event) => {
              const isAdded = events.some((e) => e.type === event.type);
              return (
                <div
                  key={event.type}
                  className={`p-4 rounded-lg border ${
                    isAdded
                      ? "bg-green-50 border-green-200"
                      : "bg-white border-gray-200"
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-gray-900">{event.title}</h4>
                    {isAdded ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <Check className="h-3 w-3 mr-1" />
                        Added
                      </span>
                    ) : (
                      <Button
                        variant="primary"
                        size="sm"
                        icon={Plus}
                        onClick={() => addSingleStandardEvent(event)}
                        disabled={!weddingDate}
                      >
                        Add
                      </Button>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{event.description}</p>
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="h-4 w-4 mr-1" />
                    {event.duration_minutes} minutes
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Event Form */}
      {(isAddingEvent || editingEvent) && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            {editingEvent ? "Edit Event" : "Add Custom Event"}
          </h3>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event Type
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleTypeChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                {eventTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Enter event title"
              error={formErrors.title}
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                placeholder="Enter event description"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Date"
                name="event_date"
                type="date"
                value={formData.event_date}
                onChange={handleInputChange}
                error={formErrors.event_date}
                required
              />
              <Input
                label="Time"
                name="event_time"
                type="time"
                value={formData.event_time}
                onChange={handleInputChange}
                error={formErrors.event_time}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="Enter location"
                icon={MapPin}
              />
              <Input
                label="Duration (minutes)"
                name="duration_minutes"
                type="number"
                value={formData.duration_minutes.toString()}
                onChange={handleInputChange}
                min="5"
                step="5"
                icon={Clock}
              />
            </div>

            {/* Music Section */}
            <div className="border-t pt-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Music className="w-5 h-5 mr-2 text-rose-600" />
                Music & Playlist Requests
              </h4>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Specific Song Requests
                  </label>
                  <textarea
                    name="music_notes"
                    value={formData.music_notes}
                    onChange={handleInputChange}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                    placeholder="e.g., 'Bridal party entrance song: Perfect by Ed Sheeran', 'First dance: At Last by Etta James'"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Playlist Requests & Preferences
                  </label>
                  <textarea
                    name="playlist_requests"
                    value={formData.playlist_requests}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                    placeholder="e.g., 'Cocktail hour: Jazz and acoustic covers', 'Reception: Mix of 80s, 90s, and current hits', 'Do NOT play: Country music'"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button variant="outline" onClick={cancelForm}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() =>
                  editingEvent ? handleUpdateEvent(editingEvent) : handleAddEvent()
                }
              >
                {editingEvent ? "Update Event" : "Add Event"}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Timeline Events */}
      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Your Wedding Day Timeline</h3>
        </div>

        {events.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">No events yet</h4>
            <p className="text-gray-600 mb-6">
              {standardEventsAdded
                ? "Add custom events or edit the standard events to fit your schedule"
                : "Get started by adding standard events or creating custom ones"}
            </p>
            <Button
              variant="primary"
              icon={Plus}
              onClick={() => setIsAddingEvent(true)}
            >
              Add Your First Event
            </Button>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200"></div>

            <div className="divide-y divide-gray-100">
              {events.map((event, index) => (
                <div key={event.id} className="p-6 relative">
                  <div className="absolute left-8 top-8 w-4 h-4 rounded-full bg-rose-500 transform -translate-x-1/2 border-2 border-white"></div>

                  <div className="ml-12">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-rose-100 text-rose-800">
                            {format(parseISO(`2000-01-01T${event.event_time}`), "h:mm a")}
                          </span>
                          <h4 className="text-lg font-medium text-gray-900">{event.title}</h4>
                        </div>

                        {event.description && (
                          <p className="text-gray-600 mb-3">{event.description}</p>
                        )}

                        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {format(parseISO(event.event_date), "MMMM d, yyyy")}
                          </div>
                          {event.duration_minutes && (
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              {event.duration_minutes} minutes
                            </div>
                          )}
                          {event.location && (
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 mr-1" />
                              {event.location}
                            </div>
                          )}
                        </div>

                        {/* Music Information */}
                        {(event.music_notes || event.playlist_requests) && (
                          <div className="mt-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                            <div className="flex items-center mb-2">
                              <Music className="w-4 h-4 text-purple-600 mr-2" />
                              <span className="text-sm font-medium text-purple-900">Music Requests</span>
                            </div>
                            {event.music_notes && (
                              <p className="text-sm text-purple-800 mb-1">
                                <strong>Songs:</strong> {event.music_notes}
                              </p>
                            )}
                            {event.playlist_requests && (
                              <p className="text-sm text-purple-800">
                                <strong>Playlist:</strong> {event.playlist_requests}
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="ml-4 flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          icon={Edit2}
                          size="sm"
                          onClick={() => startEditing(event)}
                        />
                        <Button
                          variant="ghost"
                          icon={X}
                          size="sm"
                          onClick={() => handleDeleteEvent(event.id)}
                          className="text-red-500 hover:text-red-700"
                        />
                      </div>
                    </div>

                    {index < events.length - 1 && (
                      <div className="mt-4 text-xs text-gray-500">
                        {calculateTimeDifference(event, events[index + 1])}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};