import React, { useState, useEffect, useMemo, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  signInWithCustomToken, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot, 
  addDoc,
  updateDoc, 
  arrayUnion,
  arrayRemove, 
  query,
  where,
  deleteDoc
} from 'firebase/firestore';
import { 
  MapPin, 
  Compass, 
  List as ListIcon, 
  Calendar, 
  Users, 
  Star, 
  Plus, 
  Minus,
  Navigation,
  Utensils,
  Music,
  Ticket,
  Heart,
  X,
  Bookmark,
  Play,
  SlidersHorizontal,
  Sparkles,
  Clock,
  ArrowRight,
  Share2,
  Search,
  Phone,
  MessageSquare,
  Send,
  Loader2,
  ChevronLeft,
  Trash2,
  ChevronRight,
  Map as MapIcon,
  CheckCircle2,
  Copy
} from 'lucide-react';

// --- Configuration & Initialization ---
const appId = typeof __app_id !== 'undefined' ? __app_id : 'vibepath-app';
const firebaseConfig = JSON.parse(__firebase_config);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const apiKey = ""; // Provided by environment

const MOCK_PLACES = [
  { id: '1', name: 'The Dusty Bookshop', category: 'Activity', price: 2, rating: 4.8, image: 'https://images.unsplash.com/photo-1521017432531-fbd92d768814?auto=format&fit=crop&w=600', location: 'Kings Road, London', tags: ['Quiet', 'Study'], description: 'A vintage sanctuary for bibliophiles and quiet thinkers.', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-girl-in-a-bookstore-4444-large.mp4', lat: 30, lng: 25 },
  { id: '2', name: 'Blue Velvet Jazz Bar', category: 'Bar', price: 3, rating: 4.9, image: 'https://images.unsplash.com/photo-1514525253361-bee8718a747c?auto=format&fit=crop&w=600', location: 'Chelsea, London', tags: ['Romantic', 'Live Music'], description: 'Deep blues and experimental jazz in an intimate setting.', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-jazz-band-playing-on-stage-41221-large.mp4', lat: 65, lng: 40 },
  { id: '3', name: 'Hidden Garden Kitchen', category: 'Restaurant', price: 4, rating: 4.7, image: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=600', location: 'Sloane Square, London', tags: ['Outdoor', 'Romantic', 'Gourmet'], description: 'Secret garden dining with locally sourced ingredients.', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-friends-toasting-at-a-dinner-party-41120-large.mp4', lat: 45, lng: 75 },
  { id: '4', name: 'Neon Arcade', category: 'Activity', price: 2, rating: 4.5, image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=600', location: 'Fulham, London', tags: ['Fun', 'Groups'], description: 'Retro gaming fueled by neon lights and high energy.', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-excited-people-playing-arcade-games-41122-large.mp4', lat: 80, lng: 20 },
  { id: '5', name: 'Sketch', category: 'Restaurant', price: 4, rating: 4.6, image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600', location: 'Mayfair, London', tags: ['Romantic', 'Art'], description: 'The intersection of high art and fine dining in the heart of Mayfair.', videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-woman-sitting-in-a-restaurant-4448-large.mp4', lat: 35, lng: 60 },
];

const VIBE_OPTIONS = ['Romantic', 'Fun', 'Quiet', 'Live Music', 'Outdoor', 'Groups', 'Study', 'Art', 'Gourmet'];
const CATEGORY_OPTIONS = ['Restaurant', 'Bar', 'Activity', 'Cafe'];

// --- Utility Components ---
const MockMap = ({ places }) => (
  <div className="w-full h-full bg-zinc-900 rounded-[32px] relative overflow-hidden border border-white/10 flex items-center justify-center animate-in fade-in duration-500 min-h-[50vh]">
     <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#4f46e5 1.5px, transparent 1.5px)', backgroundSize: '30px 30px' }} />
     <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-[10px] font-bold tracking-widest text-indigo-400 z-10">RADAR ACTIVE</div>
     
     {places.map(p => (
       <div key={p.id} className="absolute flex flex-col items-center group cursor-pointer transition-transform hover:scale-125 hover:z-20" style={{ left: `${p.lng}%`, top: `${p.lat}%`, transform: 'translate(-50%, -50%)' }}>
         <div className="bg-indigo-600 p-2 rounded-full shadow-lg shadow-indigo-500/50 relative">
           <MapPin size={16} fill="white" className="text-indigo-600" />
           <div className="absolute inset-0 bg-indigo-500 rounded-full animate-ping opacity-20"></div>
         </div>
         <span className="bg-black/80 backdrop-blur text-[10px] font-bold px-3 py-1.5 rounded-xl mt-2 border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap absolute top-full shadow-xl">
           {p.name}
         </span>
       </div>
     ))}
  </div>
);

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('home'); 
  const [searchQuery, setSearchQuery] = useState('');
  
  // UI States
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'map'
  const [viewingList, setViewingList] = useState(null); // specific list object
  const [toast, setToast] = useState({ visible: false, message: '' });
  
  // Data States
  const [userLists, setUserLists] = useState([]);
  const [likedPlaces, setLikedPlaces] = useState([]);
  const [newListName, setNewListName] = useState('');
  const [homeFilters, setHomeFilters] = useState({ categories: [], vibes: [], maxPrice: 4 });
  
  // Planner States
  const [plannerStep, setPlannerStep] = useState('config'); // 'config', 'result'
  const [planMode, setPlanMode] = useState('collection'); // 'collection', 'freestyle'
  const [selectedListId, setSelectedListId] = useState(null);
  const [chatInput, setChatInput] = useState('');
  const [planConfig, setPlanConfig] = useState({ days: 2, budget: 3, anchorSpots: [] });
  const [itinerary, setItinerary] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // --- Auth & Initial Data ---
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) { console.error("Auth error:", err); }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  // --- Real-time Sync (Lists & Likes) ---
  useEffect(() => {
    if (!user) return;
    
    // Sync Lists
    const listRef = collection(db, 'artifacts', appId, 'users', user.uid, 'lists');
    const unsubLists = onSnapshot(listRef, (snapshot) => {
      const lists = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUserLists(lists);
      // Update currently viewed list if it changes
      if (viewingList) {
        const updated = lists.find(l => l.id === viewingList.id);
        if (updated) setViewingList(updated);
        else setViewingList(null);
      }
    });

    // Sync Likes
    const likesRef = collection(db, 'artifacts', appId, 'users', user.uid, 'likes');
    const unsubLikes = onSnapshot(likesRef, (snapshot) => {
      setLikedPlaces(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => { unsubLists(); unsubLikes(); };
  }, [user, viewingList?.id]);

  // --- Helpers ---
  const showToastMsg = (msg) => {
    setToast({ visible: true, message: msg });
    setTimeout(() => setToast({ visible: false, message: '' }), 3000);
  };

  // --- Firestore Actions ---
  const toggleLike = async (place) => {
    if (!user) return;
    const likeRef = doc(db, 'artifacts', appId, 'users', user.uid, 'likes', place.id);
    const isLiked = likedPlaces.find(p => p.id === place.id);
    
    try {
      if (isLiked) {
        await deleteDoc(likeRef);
        showToastMsg('Removed from likes 💔');
      } else {
        await setDoc(likeRef, place);
        showToastMsg('Added to likes! ❤️');
      }
    } catch (err) { console.error("Like error:", err); }
  };

  const createAndSaveList = async () => {
    if (!newListName.trim() || !user || !selectedPlace) return;
    try {
      const listRef = collection(db, 'artifacts', appId, 'users', user.uid, 'lists');
      await addDoc(listRef, { 
        title: newListName, 
        items: [selectedPlace], 
        createdAt: Date.now(),
        color: ['bg-indigo-500', 'bg-rose-500', 'bg-amber-500', 'bg-purple-500'][userLists.length % 4]
      });
      showToastMsg(`Created & saved to ${newListName}! ✨`);
      setNewListName('');
      setShowSaveModal(false);
    } catch (err) { console.error("Error creating list:", err); }
  };

  const saveToList = async (listId, listTitle) => {
    if (!selectedPlace || !user) return;
    try {
      const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'lists', listId);
      await updateDoc(docRef, { items: arrayUnion(selectedPlace) });
      showToastMsg(`Saved to ${listTitle} 📍`);
      setShowSaveModal(false);
    } catch (err) { console.error("Error saving to list:", err); }
  };

  const removeFromList = async (listId, placeObj) => {
    if (!user) return;
    try {
      const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'lists', listId);
      await updateDoc(docRef, { items: arrayRemove(placeObj) });
      showToastMsg('Removed from collection.');
    } catch (err) { console.error(err); }
  };

  const deleteList = async (id) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'lists', id));
      showToastMsg('Collection deleted.');
    } catch (err) { console.error(err); }
  };

  const shareList = (list) => {
    const text = `Check out my VibePath list: ${list.title}!\n\n` + list.items.map((i, idx) => `${idx+1}. ${i.name} (${i.location})`).join('\n');
    try {
      // Fallback execution for iframes
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("Copy");
      textArea.remove();
      showToastMsg('List copied to clipboard! 🔗');
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  // --- AI Itinerary Logic ---
  const generateAITrip = async () => {
    if (planMode === 'collection' && !selectedListId) {
      showToastMsg("Please select a collection first!");
      return;
    }
    
    setIsGenerating(true);
    setPlannerStep('result');

    let spotsNames = "";
    let context = "";

    if (planMode === 'collection') {
      const selectedList = userLists.find(l => l.id === selectedListId);
      spotsNames = selectedList?.items.map(i => i.name).join(', ') || "London highlights";
      context = `Using places from my collection.`;
    } else {
      const anchors = likedPlaces.filter(p => planConfig.anchorSpots.includes(p.id));
      spotsNames = anchors.map(p => p.name).join(', ') || "London highlights";
      context = `Trip duration: ${planConfig.days} days. Budget constraint: ${planConfig.budget}/4.`;
    }

    const prompt = `Act as a luxury travel concierge. I am visiting London. ${context}
    I want to visit these specific places: ${spotsNames}. 
    User special requests: "${chatInput}". 
    Create a logical, time-optimized itinerary. Format the response as JSON with this strict structure: 
    { "title": "Trip Title", "days": [ { "day": 1, "plan": [ { "time": "10:00 AM", "activity": "Name", "description": "short tip" } ] } ] }`;

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          contents: [{ parts: [{ text: prompt }] }], 
          generationConfig: { responseMimeType: "application/json" } 
        })
      });
      const data = await response.json();
      const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      setItinerary(JSON.parse(resultText));
    } catch (err) {
      console.error(err);
      showToastMsg("Failed to generate trip. Try again.");
      setPlannerStep('config');
    } finally {
      setIsGenerating(false);
    }
  };

  const exportRouteToMaps = () => {
    if (!itinerary) return;
    const waypoints = itinerary.days.flatMap(d => d.plan.map(p => encodeURIComponent(p.activity))).join('|');
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${waypoints}`, '_blank');
  };

  // --- Filter Logic ---
  const filteredPlaces = useMemo(() => {
    return MOCK_PLACES.filter(place => {
      const matchSearch = place.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          place.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())) || 
                          place.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = homeFilters.categories.length === 0 || homeFilters.categories.includes(place.category);
      const matchVibe = homeFilters.vibes.length === 0 || place.tags.some(t => homeFilters.vibes.includes(t));
      const matchPrice = place.price <= homeFilters.maxPrice;
      
      return matchSearch && matchCat && matchVibe && matchPrice;
    });
  }, [searchQuery, homeFilters]);

  const currentDiscoverPlace = MOCK_PLACES[currentIndex % MOCK_PLACES.length];

  return (
    <div className="h-screen bg-black text-white font-sans overflow-hidden flex flex-col">
      
      {/* GLOBAL TOAST NOTIFICATION */}
      {toast.visible && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[200] bg-white text-black px-6 py-3 rounded-full font-black text-sm shadow-2xl shadow-indigo-500/20 animate-in slide-in-from-top-4 fade-in duration-300 flex items-center gap-2 whitespace-nowrap">
          <CheckCircle2 size={16} className="text-indigo-600" /> {toast.message}
        </div>
      )}

      {/* HEADER */}
      <header className="px-6 py-4 flex justify-between items-center z-50 bg-black/80 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-2">
          <Sparkles className="text-indigo-500" size={20} />
          <h1 className="text-xl font-black tracking-tighter italic uppercase">VibePath</h1>
        </div>
        <div className="bg-white/5 px-3 py-1.5 rounded-full border border-white/10 text-[10px] font-bold tracking-widest text-indigo-400">
          LONDON
        </div>
      </header>

      <main className="flex-1 overflow-y-auto relative">
        
        {/* HOME TAB */}
        {activeTab === 'home' && (
          <div className="p-6 pb-32 max-w-lg mx-auto animate-in fade-in duration-500">
            <div className="flex justify-between items-end mb-8">
              <h2 className="text-4xl font-black italic uppercase tracking-tighter">Search<br/>Your Vibe.</h2>
              <div className="flex gap-2 bg-white/5 p-1 rounded-full border border-white/10">
                 <button onClick={() => setViewMode('list')} className={`p-2 rounded-full transition-colors ${viewMode === 'list' ? 'bg-indigo-600' : 'text-gray-500'}`}><ListIcon size={16} /></button>
                 <button onClick={() => setViewMode('map')} className={`p-2 rounded-full transition-colors ${viewMode === 'map' ? 'bg-indigo-600' : 'text-gray-500'}`}><MapIcon size={16} /></button>
              </div>
            </div>

            <div className="relative mb-6">
              <input 
                type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Where to?" className="w-full bg-white/5 border border-white/10 px-6 py-5 rounded-3xl outline-none focus:ring-2 ring-indigo-500/50 pr-24"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <button onClick={() => setShowFilterDrawer(true)} className="p-2 text-gray-400 hover:text-white transition-colors relative">
                  <SlidersHorizontal size={20} />
                  {(homeFilters.categories.length > 0 || homeFilters.vibes.length > 0) && <div className="absolute top-1 right-1 w-2 h-2 bg-indigo-500 rounded-full"></div>}
                </button>
                <div className="bg-indigo-600 p-2.5 rounded-xl"><Search size={18} /></div>
              </div>
            </div>
            
            {viewMode === 'map' ? (
              <div className="h-[60vh]"><MockMap places={filteredPlaces} /></div>
            ) : (
              <div className="space-y-8">
                {filteredPlaces.length === 0 ? (
                  <p className="text-center text-gray-500 py-10 font-bold">No vibes found matching filters.</p>
                ) : filteredPlaces.map(place => (
                  <div key={place.id} className="bg-white/5 rounded-[40px] overflow-hidden border border-white/5 shadow-2xl group transition-transform hover:scale-[1.01]">
                    <img src={place.image} className="w-full aspect-video object-cover" />
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="text-2xl font-black italic uppercase">{place.name}</h4>
                        <button onClick={() => toggleLike(place)} className="p-2 hover:scale-110 transition-transform">
                          <Heart size={20} className={likedPlaces.find(l => l.id === place.id) ? "fill-red-500 text-red-500" : "text-gray-400"} />
                        </button>
                      </div>
                      <div className="flex gap-4 text-xs font-bold text-gray-400 mb-6">
                        <span className="flex items-center gap-1 text-yellow-400"><Star size={14} fill="currentColor" /> {place.rating}</span>
                        <span className="flex items-center gap-1 text-indigo-400">
                          {[1,2,3,4].map(i => <span key={i} className={i <= place.price ? 'text-indigo-400' : 'text-white/20'}>$</span>)}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => { setSelectedPlace(place); setShowSaveModal(true); }} className="flex-1 bg-white/10 hover:bg-white/20 py-3 rounded-2xl font-bold text-sm transition-colors flex justify-center items-center gap-2">
                          <Bookmark size={16} /> Save Spot
                        </button>
                        <button className="p-3 bg-indigo-600 rounded-2xl"><Navigation size={18} /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* DISCOVER TAB */}
        {activeTab === 'discover' && (
          <div className="h-full flex flex-col justify-center items-center px-6 pb-32">
            <div className="relative w-full max-w-sm h-[70vh] animate-in zoom-in-95 duration-300">
              <div className="w-full h-full rounded-[50px] overflow-hidden relative border border-white/10 shadow-2xl">
                <img src={currentDiscoverPlace.image} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent p-8 flex flex-col justify-end">
                  <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-2">{currentDiscoverPlace.name}</h2>
                  <div className="flex items-center gap-4 text-sm text-gray-400 mb-6">
                    <span className="text-white flex items-center gap-1"><Star size={14} fill="currentColor" /> {currentDiscoverPlace.rating}</span>
                    <span>{currentDiscoverPlace.location}</span>
                  </div>
                  
                  <button 
                    onClick={() => { setSelectedPlace(currentDiscoverPlace); setShowVideoModal(true); }}
                    className="relative h-20 w-full rounded-2xl overflow-hidden bg-white/10 border border-white/20 group"
                  >
                    <img src={currentDiscoverPlace.image} className="w-full h-full object-cover opacity-20 blur-sm" />
                    <div className="absolute inset-0 flex items-center justify-center gap-2">
                      <Play size={20} fill="white" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Watch Vibe Clip</span>
                    </div>
                  </button>
                </div>
              </div>

              <div className="absolute -bottom-6 left-0 right-0 flex justify-center items-center gap-6">
                <button onClick={() => setCurrentIndex(c => c+1)} className="w-14 h-14 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full flex items-center justify-center text-red-500 active:scale-90 transition-transform"><X size={28} /></button>
                <button onClick={() => { setSelectedPlace(currentDiscoverPlace); setShowSaveModal(true); }} className="w-12 h-12 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full flex items-center justify-center text-indigo-400 active:scale-90 transition-transform"><Bookmark size={22} /></button>
                <button onClick={() => { toggleLike(currentDiscoverPlace); setCurrentIndex(c => c+1); }} className="w-14 h-14 bg-white text-black rounded-full flex items-center justify-center active:scale-90 transition-transform"><Heart size={28} className="fill-red-500 text-red-500" /></button>
              </div>
            </div>
          </div>
        )}

        {/* LISTS TAB */}
        {activeTab === 'lists' && (
          <div className="p-8 pb-32 max-w-lg mx-auto animate-in fade-in duration-500">
            {viewingList ? (
              <div className="animate-in slide-in-from-right duration-300">
                <button onClick={() => setViewingList(null)} className="mb-6 flex items-center gap-2 text-gray-500 text-xs font-bold uppercase hover:text-white transition-colors"><ChevronLeft size={16}/> Back to Collections</button>
                
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h2 className="text-4xl font-black italic uppercase tracking-tighter text-indigo-500">{viewingList.title}</h2>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">{viewingList.items?.length || 0} Saved Vibes</p>
                  </div>
                  <button onClick={() => shareList(viewingList)} className="p-3 bg-white/5 rounded-full hover:bg-white/10 transition-colors border border-white/10 text-indigo-400">
                    <Share2 size={18} />
                  </button>
                </div>

                <div className="flex gap-2 bg-white/5 p-1 rounded-full border border-white/10 mb-8 w-fit">
                   <button onClick={() => setViewMode('list')} className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-colors ${viewMode === 'list' ? 'bg-indigo-600' : 'text-gray-500'}`}>List</button>
                   <button onClick={() => setViewMode('map')} className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-colors ${viewMode === 'map' ? 'bg-indigo-600' : 'text-gray-500'}`}>Map</button>
                </div>

                {viewMode === 'map' ? (
                  <div className="h-[50vh]"><MockMap places={viewingList.items || []} /></div>
                ) : (
                  <div className="space-y-4">
                    {(!viewingList.items || viewingList.items.length === 0) ? (
                      <p className="text-center text-gray-500 py-10 font-bold">This collection is empty.</p>
                    ) : viewingList.items.map((item, idx) => (
                      <div key={idx} className="flex gap-4 items-center bg-white/5 p-4 rounded-3xl border border-white/5">
                        <img src={item.image} className="w-16 h-16 rounded-2xl object-cover" />
                        <div className="flex-1">
                          <h4 className="text-sm font-bold">{item.name}</h4>
                          <p className="text-[10px] text-gray-500 uppercase mt-1">{item.location}</p>
                        </div>
                        <button onClick={() => removeFromList(viewingList.id, item)} className="p-3 text-gray-600 hover:text-red-500 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <>
                <h2 className="text-3xl font-black italic uppercase mb-8">Collections</h2>
                <div className="grid grid-cols-2 gap-4 mb-12">
                  {userLists.map(list => (
                    <div key={list.id} className="bg-white/5 border border-white/10 p-6 rounded-[32px] group relative cursor-pointer hover:bg-white/10 transition-colors" onClick={() => { setViewingList(list); setViewMode('list'); }}>
                      <button 
                        onClick={(e) => { e.stopPropagation(); deleteList(list.id); }}
                        className="absolute top-4 right-4 text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={16} />
                      </button>
                      <div className={`w-10 h-10 rounded-2xl mb-4 ${list.color || 'bg-indigo-600'} flex items-center justify-center`}>
                        <Heart size={18} fill="white" />
                      </div>
                      <h3 className="font-bold text-sm uppercase tracking-tighter mb-1 truncate">{list.title}</h3>
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest">{list.items?.length || 0} spots</p>
                    </div>
                  ))}
                  <button 
                    onClick={() => { const n = prompt("New list name:"); if(n) {setNewListName(n); createAndSaveList();} }}
                    className="bg-white/5 border border-dashed border-white/20 p-6 rounded-[32px] flex flex-col items-center justify-center gap-2 group hover:border-indigo-500/50 transition-colors"
                  >
                    <Plus size={24} className="text-gray-600 group-hover:text-indigo-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Add List</span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* PLAN TAB */}
        {activeTab === 'plan' && (
          <div className="h-full overflow-y-auto px-6 pb-32 animate-in slide-in-from-right duration-500 max-w-lg mx-auto">
            {plannerStep === 'config' && (
              <>
                <div className="pt-6 mb-8">
                  <h1 className="text-5xl font-black italic uppercase tracking-tighter leading-none">Your Route</h1>
                  <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em] mt-2">Engineer the perfect stay</p>
                </div>

                <div className="flex bg-white/5 p-1 rounded-full border border-white/10 mb-8">
                  <button 
                    onClick={() => setPlanMode('collection')} 
                    className={`flex-1 py-3 rounded-full text-xs font-bold uppercase tracking-widest transition-colors ${planMode === 'collection' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500'}`}
                  >
                    Use Collection
                  </button>
                  <button 
                    onClick={() => setPlanMode('freestyle')} 
                    className={`flex-1 py-3 rounded-full text-xs font-bold uppercase tracking-widest transition-colors ${planMode === 'freestyle' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500'}`}
                  >
                    Freestyle
                  </button>
                </div>

                <div className="space-y-6">
                  {planMode === 'collection' ? (
                    <section className="space-y-4 animate-in fade-in duration-300">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-2">Select a Base Collection</label>
                      <div className="grid gap-3">
                        {userLists.length === 0 ? (
                          <div className="text-center py-12 bg-white/5 rounded-3xl border border-dashed border-white/20">
                            <p className="text-gray-500 text-sm">Save spots to a collection first!</p>
                          </div>
                        ) : userLists.map(list => (
                          <button 
                            key={list.id} 
                            onClick={() => setSelectedListId(list.id)}
                            className={`p-5 rounded-3xl text-left transition-all border ${selectedListId === list.id ? 'bg-indigo-600/20 border-indigo-500' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <p className={`font-black italic uppercase text-lg ${selectedListId === list.id ? 'text-indigo-400' : 'text-white'}`}>{list.title}</p>
                                <p className="text-xs text-gray-500">{list.items?.length || 0} locations</p>
                              </div>
                              {selectedListId === list.id && <CheckCircle2 className="text-indigo-400" />}
                            </div>
                          </button>
                        ))}
                      </div>
                    </section>
                  ) : (
                    <div className="space-y-6 animate-in fade-in duration-300">
                      {/* Stay Duration */}
                      <section className="bg-white/5 border border-white/10 p-6 rounded-3xl space-y-4">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Duration of Stay</label>
                          <div className="text-xl font-black text-white italic">{planConfig.days} Days</div>
                        </div>
                        <div className="flex gap-4">
                           <button 
                            onClick={() => setPlanConfig({...planConfig, days: Math.max(1, planConfig.days - 1)})}
                            className="flex-1 bg-white/5 hover:bg-white/10 border border-white/5 py-3 rounded-xl flex justify-center items-center transition-colors"
                           >
                             <Minus size={20} className="text-indigo-400" />
                           </button>
                           <button 
                            onClick={() => setPlanConfig({...planConfig, days: Math.min(14, planConfig.days + 1)})}
                            className="flex-1 bg-white/5 hover:bg-white/10 border border-white/5 py-3 rounded-xl flex justify-center items-center transition-colors"
                           >
                             <Plus size={20} className="text-indigo-400" />
                           </button>
                        </div>
                      </section>

                      {/* Trip Budget */}
                      <section className="bg-white/5 border border-white/10 p-6 rounded-3xl space-y-4">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Vibe Budget</label>
                          <div className="flex text-lg font-bold">
                            {[1, 2, 3, 4].map(i => <span key={i} className={i <= planConfig.budget ? 'text-indigo-400' : 'text-white/20'}>$</span>)}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {[1, 2, 3, 4].map(val => (
                            <button 
                              key={val}
                              onClick={() => setPlanConfig({...planConfig, budget: val})}
                              className={`flex-1 py-3 rounded-2xl text-xs font-black transition-all border ${planConfig.budget === val ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400' : 'bg-white/5 border-white/10 text-gray-500'}`}
                            >
                              {Array(val).fill('$').join('')}
                            </button>
                          ))}
                        </div>
                      </section>

                      {/* Anchor Spots Selection */}
                      <section className="space-y-4">
                        <div className="flex justify-between items-end px-2">
                          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Liked Anchor Spots</label>
                          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{planConfig.anchorSpots.length} Selected</span>
                        </div>
                        
                        {likedPlaces.length > 0 ? (
                          <div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                            {likedPlaces.map(place => {
                              const isAnchor = planConfig.anchorSpots.includes(place.id);
                              return (
                                <button 
                                  key={place.id}
                                  onClick={() => setPlanConfig(prev => ({
                                    ...prev,
                                    anchorSpots: isAnchor ? prev.anchorSpots.filter(id => id !== place.id) : [...prev.anchorSpots, place.id]
                                  }))}
                                  className={`flex items-center gap-4 p-3 rounded-2xl border transition-all text-left ${isAnchor ? 'bg-indigo-600/20 border-indigo-500' : 'bg-white/5 border-white/10 opacity-70 hover:opacity-100'}`}
                                >
                                  <img src={place.image} className="w-12 h-12 rounded-xl object-cover" />
                                  <div className="flex-1">
                                    <h4 className={`text-xs font-black uppercase tracking-tighter ${isAnchor ? 'text-white' : 'text-gray-400'}`}>{place.name}</h4>
                                    <p className="text-[9px] text-gray-500 font-bold uppercase">{place.location}</p>
                                  </div>
                                  {isAnchor ? <CheckCircle2 size={18} className="text-indigo-400" /> : <Plus size={18} className="text-gray-600" />}
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="bg-white/5 border border-dashed border-white/20 p-8 rounded-3xl text-center">
                            <Heart size={24} className="mx-auto mb-3 text-gray-600" />
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Like spots to add them as anchors</p>
                          </div>
                        )}
                      </section>
                    </div>
                  )}

                  {/* Common Chat Input */}
                  <section className="pt-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-2 block mb-2">Special Requests</label>
                    <textarea 
                      value={chatInput} onChange={e => setChatInput(e.target.value)}
                      placeholder="e.g. Include a dinner reservation at 8 PM on Day 1..."
                      className="w-full bg-white/5 border border-white/10 rounded-3xl p-5 outline-none focus:ring-2 ring-indigo-500/50 resize-none font-medium placeholder:text-gray-600 text-sm"
                      rows={3}
                    />
                  </section>

                  <button 
                    onClick={generateAITrip}
                    className="w-full bg-indigo-600 text-white font-black py-5 rounded-3xl shadow-xl shadow-indigo-500/20 active:scale-[0.98] transition-all tracking-tighter italic text-xl uppercase mt-2 flex items-center justify-center gap-3"
                  >
                    <MapIcon size={20} /> Generate Itinerary
                  </button>
                </div>
              </>
            )}

            {plannerStep === 'result' && (
              <div>
                <button onClick={() => setPlannerStep('config')} className="mb-6 flex items-center gap-2 text-gray-500 text-xs font-bold uppercase hover:text-white transition-colors"><ChevronLeft size={16}/> Back to Editor</button>
                {isGenerating ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="animate-spin text-indigo-500 mb-4" size={40} />
                    <p className="font-black italic uppercase tracking-widest text-indigo-400">Architecting Trip...</p>
                  </div>
                ) : itinerary && (
                  <div className="space-y-10 animate-in fade-in duration-1000">
                    <div className="flex justify-between items-start">
                      <h1 className="text-3xl font-black italic uppercase tracking-tighter text-indigo-500 flex-1 pr-4">{itinerary.title}</h1>
                      <button onClick={exportRouteToMaps} className="bg-white/10 p-3 rounded-full hover:bg-white/20 transition-colors border border-white/10" title="Export to Maps">
                        <MapIcon size={20} className="text-indigo-400" />
                      </button>
                    </div>

                    {itinerary.days.map((day, dIdx) => (
                      <div key={dIdx} className="space-y-6">
                        <h3 className="text-xs font-black uppercase tracking-[0.3em] text-gray-500 bg-white/5 py-2 px-4 rounded-full w-fit">Day {day.day}</h3>
                        <div className="relative pl-6 space-y-8 border-l border-indigo-500/20 ml-2">
                          {day.plan.map((item, iIdx) => (
                            <div key={iIdx} className="relative group cursor-pointer hover:scale-[1.02] transition-transform">
                              <div className="absolute -left-[30px] top-1.5 w-3 h-3 bg-indigo-500 rounded-full border-2 border-black group-hover:bg-white transition-colors" />
                              <p className="text-[10px] font-bold text-indigo-400 mb-1">{item.time}</p>
                              <div className="bg-white/5 border border-white/10 p-4 rounded-2xl hover:border-indigo-500/50 transition-colors">
                                <h4 className="font-bold text-sm">{item.activity}</h4>
                                <p className="text-[10px] text-gray-500 mt-1">{item.description}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* HUB TAB */}
        {activeTab === 'hub' && (
          <div className="p-8 text-center mt-20 animate-in fade-in">
            <div className="w-24 h-24 bg-white/10 rounded-full mx-auto mb-6 flex items-center justify-center border border-white/10">
              <Users size={40} className="text-gray-600" />
            </div>
            <h2 className="text-2xl font-black italic uppercase">Vibe Hub</h2>
            <div className="mt-10 grid grid-cols-2 gap-4">
              <div className="bg-white/5 p-6 rounded-[32px] border border-white/5 cursor-pointer hover:bg-white/10 transition-colors">
                <p className="text-2xl font-black text-indigo-500 italic">{likedPlaces.length}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Lifetime Likes</p>
              </div>
              <div className="bg-white/5 p-6 rounded-[32px] border border-white/5 cursor-pointer hover:bg-white/10 transition-colors">
                <p className="text-2xl font-black text-indigo-500 italic">{userLists.length}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Collections</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* OVERLAY: MULTI-SELECT FILTERS */}
      {showFilterDrawer && (
        <div className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-sm flex items-end animate-in fade-in duration-200">
          <div className="w-full bg-zinc-900 rounded-t-[40px] p-8 pb-12 animate-in slide-in-from-bottom duration-300 border-t border-white/10">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-bold italic uppercase tracking-tighter">Adjust Filters</h3>
              <button onClick={() => setShowFilterDrawer(false)} className="p-2"><X /></button>
            </div>
            
            <div className="space-y-8">
              <section>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-3">Categories</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORY_OPTIONS.map(cat => (
                    <button key={cat}
                      onClick={() => setHomeFilters(prev => ({ ...prev, categories: prev.categories.includes(cat) ? prev.categories.filter(c => c !== cat) : [...prev.categories, cat] }))}
                      className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all border ${homeFilters.categories.includes(cat) ? 'bg-indigo-600 border-indigo-600' : 'bg-white/5 border-white/10 text-gray-400'}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </section>

              <section>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-3">Vibes</label>
                <div className="flex flex-wrap gap-2">
                  {VIBE_OPTIONS.map(vibe => (
                    <button key={vibe}
                      onClick={() => setHomeFilters(prev => ({ ...prev, vibes: prev.vibes.includes(vibe) ? prev.vibes.filter(v => v !== vibe) : [...prev.vibes, vibe] }))}
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all border ${homeFilters.vibes.includes(vibe) ? 'bg-indigo-600 border-indigo-600' : 'bg-white/5 border-white/10 text-gray-400'}`}
                    >
                      {vibe}
                    </button>
                  ))}
                </div>
              </section>

              <section>
                 <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-3">Max Price: {homeFilters.maxPrice}/4</label>
                 <input type="range" min="1" max="4" value={homeFilters.maxPrice} onChange={(e) => setHomeFilters(prev => ({ ...prev, maxPrice: parseInt(e.target.value) }))}
                  className="w-full accent-indigo-600 h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer" />
              </section>
            </div>
            
            <button onClick={() => setShowFilterDrawer(false)} className="w-full bg-white text-black mt-10 py-4 rounded-[24px] font-black uppercase text-sm active:scale-95 transition-transform shadow-xl shadow-indigo-500/10">Apply Filters</button>
          </div>
        </div>
      )}

      {/* MODAL: SAVE TO LIST */}
      {showSaveModal && (
        <div className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-md flex items-end animate-in fade-in duration-200">
          <div className="w-full bg-zinc-900 rounded-t-[40px] p-8 pb-12 animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-bold italic uppercase tracking-tighter">Add to Collection</h3>
              <button onClick={() => setShowSaveModal(false)} className="p-2"><X /></button>
            </div>
            
            <div className="space-y-3 mb-8 overflow-y-auto max-h-[30vh]">
              {userLists.map(list => (
                <button 
                  key={list.id} 
                  onClick={() => saveToList(list.id, list.title)}
                  className="w-full text-left p-5 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 flex items-center justify-between"
                >
                  <span className="font-bold italic uppercase">{list.title}</span>
                  <Plus size={16} className="text-gray-500" />
                </button>
              ))}
              {userLists.length === 0 && <p className="text-center text-gray-500 py-4 text-xs italic">Create a list below to get started</p>}
            </div>

            <div className="flex gap-2">
              <input 
                type="text" placeholder="New list name..." 
                value={newListName} onChange={e => setNewListName(e.target.value)}
                className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none"
              />
              <button onClick={createAndSaveList} className="bg-indigo-600 px-6 rounded-2xl font-black uppercase text-xs">Create & Save</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: VIDEO PLAYER */}
      {showVideoModal && selectedPlace && (
        <div className="fixed inset-0 z-[110] bg-black animate-in fade-in duration-300">
          <video 
            src={selectedPlace.videoUrl} 
            autoPlay loop className="w-full h-full object-cover" 
            onClick={() => setShowVideoModal(false)}
          />
          <div className="absolute top-8 left-6 right-6 flex justify-between items-center pointer-events-none">
            <button className="pointer-events-auto p-3 bg-black/40 backdrop-blur-md rounded-full border border-white/10" onClick={() => setShowVideoModal(false)}>
              <ChevronLeft />
            </button>
            <div className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
              <p className="text-xs font-bold uppercase tracking-widest italic">{selectedPlace.name}</p>
            </div>
            <div className="w-10"></div>
          </div>

          {/* Interactive Player Overlays */}
          <div className="absolute right-6 bottom-32 flex flex-col gap-6 items-center">
            <button 
              onClick={(e) => { e.stopPropagation(); toggleLike(selectedPlace); }} 
              className="flex flex-col items-center gap-1 hover:scale-110 transition-transform"
            >
              <div className="p-4 bg-black/40 backdrop-blur-md rounded-full border border-white/10">
                <Heart size={24} className={likedPlaces.find(l => l.id === selectedPlace.id) ? "fill-red-500 text-red-500" : "text-white"} />
              </div>
              <span className="text-[10px] font-bold text-white drop-shadow-md">Like</span>
            </button>

            <button 
              onClick={(e) => { e.stopPropagation(); setShowSaveModal(true); }} 
              className="flex flex-col items-center gap-1 hover:scale-110 transition-transform"
            >
              <div className="p-4 bg-black/40 backdrop-blur-md rounded-full border border-white/10">
                <Bookmark size={24} className="text-white" />
              </div>
              <span className="text-[10px] font-bold text-white drop-shadow-md">Save</span>
            </button>

            <button 
               onClick={(e) => { e.stopPropagation(); shareList({title: selectedPlace.name, items: [selectedPlace]}); }}
               className="flex flex-col items-center gap-1 hover:scale-110 transition-transform"
            >
              <div className="p-4 bg-black/40 backdrop-blur-md rounded-full border border-white/10">
                <Share2 size={24} className="text-white" />
              </div>
              <span className="text-[10px] font-bold text-white drop-shadow-md">Share</span>
            </button>
          </div>
        </div>
      )}

      {/* NAV BAR */}
      <nav className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-xl border-t border-white/5 px-6 py-4 flex justify-between items-center z-[90]">
        <button onClick={() => {setActiveTab('home'); setViewMode('list');}} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'home' ? 'text-indigo-400 scale-110' : 'text-gray-500'}`}>
          <Search size={22} /><span className="text-[10px] font-bold uppercase tracking-tight">Home</span>
        </button>
        <button onClick={() => setActiveTab('discover')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'discover' ? 'text-indigo-400 scale-110' : 'text-gray-500'}`}>
          <Compass size={22} /><span className="text-[10px] font-bold uppercase tracking-tight">Discover</span>
        </button>
        <button onClick={() => {setActiveTab('lists'); setViewingList(null); setViewMode('list');}} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'lists' ? 'text-indigo-400 scale-110' : 'text-gray-500'}`}>
          <ListIcon size={22} /><span className="text-[10px] font-bold uppercase tracking-tight">Lists</span>
        </button>
        <button onClick={() => setActiveTab('plan')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'plan' ? 'text-indigo-400 scale-110' : 'text-gray-500'}`}>
          <div className={`p-3 rounded-full -mt-10 shadow-xl transition-all ${activeTab === 'plan' ? 'bg-indigo-600 text-white' : 'bg-white/5 text-gray-500'}`}>
            <Calendar size={22} />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-tight mt-1">Plan</span>
        </button>
        <button onClick={() => setActiveTab('hub')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'hub' ? 'text-indigo-400 scale-110' : 'text-gray-500'}`}>
          <Users size={22} /><span className="text-[10px] font-bold uppercase tracking-tight">Hub</span>
        </button>
      </nav>
    </div>
  );
}
