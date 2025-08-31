const [showReviewModal, setShowReviewModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [editingTime, setEditingTime] = useState(false);
  const [newStartTime, setNewStartTime] = useState('');
  const [newEndTime, setNewEndTime] = useState('');
  const [savingTime, setSavingTime] = useState(false);
  const [timeError, setTimeError] = useState<string | null>(null);
  const [editingTime, setEditingTime] = useState(false);
  const [newStartTime, setNewStartTime] = useState('');
  const [newEndTime, setNewEndTime] = useState('');
  const [savingTime, setSavingTime] = useState(false);
  const [timeError, setTimeError] = useState<string | null>(null);

  const calculateEndTime = (startTime: string, hours: number) => {
    const start = new Date(`2000-01-01T${startTime}`);
    start.setHours(start.getHours() + hours);
    return start.toTimeString().slice(0, 5);
  };

  const handleStartTimeChange = (time: string) => {
    setNewStartTime(time);
    if (booking?.service_packages?.hour_amount) {
      const calculatedEndTime = calculateEndTime(time, booking.service_packages.hour_amount);
      setNewEndTime(calculatedEndTime);
    }
  };

  const handleSaveTime = async () => {
    if (!booking || !newStartTime) return;

    setSavingTime(true);
    setTimeError(null);

    if (!supabase || !isSupabaseConfigured()) {
      // Mock save for demo
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update local state
      setBooking(prev => ({
        ...prev,
        events: {
          ...prev.events,
          start_time: `${prev.events.start_time.split('T')[0]}T${newStartTime}:00Z`,
          end_time: `${prev.events.end_time.split('T')[0]}T${newEndTime}:00Z`
        }
      }));
      
      setEditingTime(false);
      setSavingTime(false);
      return;
    }

    try {
      // Update the event time
      const eventDate = booking.events.start_time.split('T')[0];
      const newStartDateTime = `${eventDate}T${newStartTime}:00Z`;
    }
  }
  // Scroll to top when component mounts