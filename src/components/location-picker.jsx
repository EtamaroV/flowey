"use client";
import * as React from "react"
import { useState, useEffect, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { MapPin, LoaderCircle, Search, MapPinned, Locate } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function LocationPicker({
  className,
  autoDetectOnLoad = false,
  defaultLocation = "",
  onChange,
  variant = 'popover',
  placeholder = "Enter city, district, or area"
}) {
  // activeCity ใช้สำหรับแสดงผลใน Input (ชื่อสั้นๆ)
  const [activeCity, setActiveCity] = useState(defaultLocation)
  // locationData ใช้สำหรับเก็บข้อมูลจริงที่จะส่งกลับ (Object)
  const [locationData, setLocationData] = useState(null)
  
  const [isLoading, setIsLoading] = useState(false)
  const [locationSearch, setLocationSearch] = useState('')
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false)
  const [error, setError] = useState(null)

  const API_URL = "https://nominatim.openstreetmap.org"

  // Helper เพื่อดึงชื่อเมืองสั้นๆ จาก Address object (สำหรับแสดงผล)
  const getShortName = (address, displayName) => {
     if (!address) return displayName || "";
     const city = address.city || address.county || address.state || '';
     const region = address.state || address.country || '';
     if (city && region && city !== region) {
        return `${city}, ${region}`;
     }
     return city || displayName || "";
  }

  const getLocation = async (lat, long) => {
    setIsLoading(true)
    try {
      const res = await fetch(`${API_URL}/reverse?lat=${lat}&lon=${long}&format=json`)
      const data = await res.json()
      
      // สร้าง Object ที่ต้องการ
      const locationObj = {
        display_name: data.display_name,
        lat: data.lat,
        lon: data.lon
      }

      // หาชื่อสั้นๆ เพื่อใส่ใน Input
      const shortName = getShortName(data.address, data.display_name);

      setActiveCity(shortName)
      setLocationData(locationObj) // Update state
      
    } catch (error) {
      console.log("Error fetching location:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const searchLocation = async () => {
    if (!locationSearch.trim()) return

    setIsLoading(true)
    try {
      const res = await fetch(
        `${API_URL}/search?q=${encodeURIComponent(locationSearch)}&format=json&addressdetails=1`
      )
      const data = await res.json()

      if (data && data.length > 0) {
        const place = data[0]
        
        // สร้าง Object ที่ต้องการ
        const locationObj = {
          display_name: place.display_name,
          lat: place.lat,
          lon: place.lon
        }

        const shortName = getShortName(place.address, place.display_name);

        setActiveCity(shortName)
        setLocationData(locationObj) // Update state
        setLocationSearch('')
        setSuggestions([])
        setIsPopoverOpen(false)
      } else {
        console.log("No location found")
      }
    } catch (error) {
      console.log("Error searching location:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getCurrentLocation = useCallback(() => {
    setIsLoading(true)
    setError(null)

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser")
      setIsLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition((position) => {
      const { latitude, longitude } = position.coords
      getLocation(latitude, longitude)
    }, (error) => {
      let errorMessage = "Unable to retrieve location"
      // ... error handling code ...
      setError(errorMessage)
      setIsLoading(false)
    }, { timeout: 10000, enableHighAccuracy: true })
  }, []);

  const fetchSuggestions = async (query) => {
    if (!query.trim() || query.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsFetchingSuggestions(true);
    try {
      const res = await fetch(
        `${API_URL}/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5`
      );
      const data = await res.json();
      setSuggestions(data);
    } catch (error) {
      console.log("Error fetching suggestions:", error);
      setSuggestions([]);
    } finally {
      setIsFetchingSuggestions(false);
    }
  };

  const selectSuggestion = (suggestion) => {
    // สร้าง Object ที่ต้องการจาก Suggestion
    const locationObj = {
        display_name: suggestion.display_name,
        lat: suggestion.lat,
        lon: suggestion.lon
    }

    const shortName = getShortName(suggestion.address, suggestion.display_name);

    setActiveCity(shortName);
    setLocationData(locationObj); // Update state
    setLocationSearch("");
    setSuggestions([]);
    setIsPopoverOpen(false);
  };

  const formatLocationName = (suggestion) => {
     return getShortName(suggestion.address, suggestion.display_name);
  };


  useEffect(() => {
    const handler = setTimeout(() => {
      fetchSuggestions(locationSearch);
    }, 300);
    return () => clearTimeout(handler);
  }, [locationSearch]);

  useEffect(() => {
    if (!isPopoverOpen) {
      setSuggestions([]);
    }
  }, [isPopoverOpen]);

  useEffect(() => {
    if (autoDetectOnLoad && !locationData) {
      getCurrentLocation();
    }
  }, [autoDetectOnLoad, locationData, getCurrentLocation]);

  // จุดสำคัญ: ส่ง Object กลับไปเมื่อ locationData มีการเปลี่ยนแปลง
  useEffect(() => {
    if (onChange && locationData) {
      onChange(locationData);
    }
  }, [locationData, onChange]);

  // UI Code (Render part) - ส่วนนี้เหมือนเดิมเกือบทั้งหมด แค่ใช้ activeCity ในการ display
  if (variant === 'inline') {
    return (
      <div>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Input
                placeholder={placeholder}
                // ใช้ activeCity ในการแสดงผล ถ้ากำลังค้นหาให้ใช้ locationSearch
                value={locationSearch || activeCity}
                onChange={(e) => {
                  const value = e.target.value;
                  setLocationSearch(value);
                  // ถ้า user พิมพ์ใหม่ ให้เคลียร์ค่าเก่าออก (UI)
                  if (activeCity && value !== activeCity) {
                   // Optional: อาจจะยังไม่เคลียร์ locationData จนกว่าจะเลือกใหม่
                   // แต่เคลียร์ UI ให้รู้ว่ากำลังพิมพ์
                  }
                }}
                onKeyUp={(e) => e.key === 'Enter' && suggestions.length === 0 && searchLocation()}
                className="w-full px-4 py-3 bg-hunter-green-50 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-hunter-green-500" />
            </div>

            <Button
              className="rounded-md h-12 w-12 p-0 bg-gray-600 hover:bg-primary/90 text-primary-foreground"
              variant="outline"
              onClick={searchLocation}
              disabled={isLoading || !locationSearch.trim()}
              title="Search Location">
              {isLoading ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>

            <Button
              variant="outline"
              onClick={getCurrentLocation}
              className="rounded-md h-12 w-12 p-0 bg-secondary hover:bg-secondary/80 text-secondary-foreground"
              title="Use Current Location">
              <Locate className="h-4 w-4 scale-125" />
            </Button>
          </div>
          
          {/* ... Suggestion list UI (เหมือนเดิม) ... */}
           {suggestions.length > 0 && (
            <div
              id="suggestions-list"
              role="listbox"
              className="w-full bg-background rounded-md border border-border shadow-lg max-h-60 overflow-y-auto">
              {suggestions.map((suggestion) => (
                <div
                  key={suggestion.place_id}
                  className="px-4 py-2 hover:bg-muted cursor-pointer border-b border-border last:border-0 transition-colors"
                  onClick={() => selectSuggestion(suggestion)}>
                  <div className="flex items-start">
                    <MapPinned size={16} className="mt-0.5 mr-2 shrink-0 text-primary" />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {formatLocationName(suggestion)}
                      </p>
                      <p className="text-xs text-muted-foreground truncate max-w-[250px]">
                        {suggestion.display_name}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ... Loading & Error UI (เหมือนเดิม) ... */}
           {isFetchingSuggestions && locationSearch.length >= 2 && suggestions.length === 0 && (
            <div className="w-full bg-background rounded-md border border-border shadow-md p-4 text-center">
              <LoaderCircle size={20} className="animate-spin mx-auto text-primary" />
              <p className="text-sm text-muted-foreground mt-1">Searching locations...</p>
            </div>
          )}
          {locationSearch.length >= 2 && !isFetchingSuggestions && suggestions.length === 0 && (
             <div className="w-full bg-background rounded-md border border-border shadow-md p-4 text-center">
              <p className="text-sm text-muted-foreground">No locations found for &quot;{locationSearch}&quot;</p>
            </div>
          )}
           {error && (
            <div className="w-full bg-destructive/10 rounded-md border border-destructive/20 p-3 text-center">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Popover UI logic (ปรับปรุง Input value)
  return (
    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
      <PopoverTrigger asChild>
        <div
          className={cn(
            "flex items-center gap-2 text-muted-foreground hover:text-foreground border-b border-transparent hover:border-primary cursor-pointer px-3 py-2 transition-colors",
            className
          )}>
          <MapPin size={16} className="text-primary" />
          {isLoading ? (
            <div className="flex items-center gap-1">
              <LoaderCircle size={14} className="animate-spin" />
              <span className="text-sm">Locating...</span>
            </div>
          ) : (
            <span className="text-sm font-medium">
              {activeCity.length > 15 ? activeCity.slice(0, 15) + '...' : activeCity || 'Select Location'}
            </span>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 p-0 shadow-lg dark:bg-background"
        side="bottom"
        align="start"
        sideOffset={4}>
        <div className="p-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Input
                placeholder={placeholder}
                // ตรงนี้ Popover แยก search กับ display อยู่แล้ว ใช้ locationSearch ได้เลย
                value={locationSearch}
                onChange={(e) => setLocationSearch(e.target.value)}
                onKeyUp={(e) => e.key === 'Enter' && suggestions.length === 0 && searchLocation()}
                className="border-border focus:border-primary focus:ring-primary/20 bg-background text-foreground" />
            </div>

             <Button
              className="rounded-md h-10 w-10 p-0 bg-primary hover:bg-primary/90 text-primary-foreground"
              variant="outline"
              onClick={searchLocation}
              disabled={isLoading || !locationSearch.trim()}
              title="Search Location">
              {isLoading ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>

            <Button
              variant="outline"
              onClick={getCurrentLocation}
              className="rounded-md h-10 w-10 p-0 bg-secondary hover:bg-secondary/80 text-secondary-foreground"
              title="Use Current Location">
              <Locate className="h-4 w-4" />
            </Button>
          </div>

          {suggestions.length > 0 && (
            <div className="z-50 mt-1 mb-4 w-full bg-background rounded-md border border-border shadow-lg max-h-60 overflow-y-auto">
              {suggestions.map((suggestion) => (
                <div
                  key={suggestion.place_id}
                  className="px-4 py-2 hover:bg-muted cursor-pointer border-b border-border last:border-0 transition-colors"
                  onClick={() => selectSuggestion(suggestion)}>
                  <div className="flex items-start">
                    <MapPinned size={16} className="mt-0.5 mr-2 shrink-0 text-primary" />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {formatLocationName(suggestion)}
                      </p>
                      <p className="text-xs text-muted-foreground truncate max-w-[250px]">
                        {suggestion.display_name}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* ... Loading/Error (เหมือนเดิม) ... */}
           {isFetchingSuggestions && locationSearch.length >= 2 && suggestions.length === 0 && (
            <div className="z-50 mt-1 mb-4 w-full bg-background rounded-md border border-border shadow-md p-4 text-center">
              <LoaderCircle size={20} className="animate-spin mx-auto text-primary" />
              <p className="text-sm text-muted-foreground mt-1">Searching locations...</p>
            </div>
          )}
          {locationSearch.length >= 2 && !isFetchingSuggestions && suggestions.length === 0 && (
            <div className="w-full bg-background rounded-md border border-border shadow-md p-4 text-center">
              <p className="text-sm text-muted-foreground">No locations found for &quot;{locationSearch}&quot;</p>
            </div>
          )}
          {error && (
            <div className="w-full bg-destructive/10 rounded-md border border-destructive/20 p-3 text-center">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

        </div>
      </PopoverContent>
    </Popover>
  );
}