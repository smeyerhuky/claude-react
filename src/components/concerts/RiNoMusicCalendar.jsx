import React, { useState } from 'react';
import { Music, MapPin, Clock, ExternalLink, ChevronDown, ChevronUp, Star, Info } from 'lucide-react';

const RiNoMusicCalendar = () => {
  const [expandedShow, setExpandedShow] = useState(null);
  const [selectedVenue, setSelectedVenue] = useState(null);

  const venues = [
    {
      id: 'larimer',
      name: 'Larimer Lounge',
      address: '2721 Larimer St',
      description: 'RiNo\'s heritage indie rock club since 2002',
      color: 'bg-purple-600',
      lightColor: 'bg-purple-100',
      borderColor: 'border-purple-600',
      links: {
        website: 'https://larimerlounge.com/',
        facebook: 'https://www.facebook.com/larimerlounge/',
        yelp: 'https://www.yelp.com/biz/larimer-lounge-denver'
      },
      shows: [
        {
          id: 'larimer-early',
          time: '5:30 PM',
          title: 'Open House',
          ageRestriction: '16+',
          artists: [
            {
              name: 'Galo',
              genre: 'House/Tech House DJ',
              description: 'Florida-based producer with releases on Night Service Only & Hood Politics',
              links: {
                beatport: 'https://www.beatport.com/artist/galo/156058',
                soundcloud: 'https://soundcloud.com/its_galo',
                spotify: 'https://open.spotify.com/artist/4v0KJDTlY8yFHSZAFmMj3L'
              }
            },
            {
              name: 'Bodega Cats',
              genre: 'Electronic',
              description: 'Electronic music duo bringing fresh beats to the underground'
            },
            {
              name: 'Cofaktor',
              genre: 'Electronic',
              description: 'Emerging electronic artist'
            }
          ]
        },
        {
          id: 'larimer-late',
          time: '9:00 PM',
          title: 'Late Night Session',
          ageRestriction: '21+',
          artists: [
            {
              name: 'Indigo',
              genre: 'Electronic/Techno',
              description: 'Atmospheric electronic soundscapes'
            },
            {
              name: 'EXHALER',
              genre: 'Indie Post-Punk',
              description: 'Denver-based band from University of Denver, blending indie, stoner, and psych',
              links: {
                bandcamp: 'https://exhaler.bandcamp.com/',
                kgnu: 'https://kgnu.org/music-posts/studio-session-exhaler/'
              }
            }
          ]
        }
      ]
    },
    {
      id: 'nocturne',
      name: 'Nocturne Jazz & Supper Club',
      address: '1330 27th St',
      description: 'Intimate jazz in an art deco setting',
      color: 'bg-amber-600',
      lightColor: 'bg-amber-100',
      borderColor: 'border-amber-600',
      links: {
        website: 'https://nocturnejazz.com/',
        instagram: 'https://www.instagram.com/nocturnedenver/',
        yelp: 'https://www.yelp.com/biz/nocturne-denver'
      },
      shows: [
        {
          id: 'nocturne-jazz',
          time: '6:30 PM & 8:45 PM',
          title: 'Jazz Sets',
          description: 'Two intimate sets of live jazz (Artist TBA)',
          note: 'Reservations recommended'
        }
      ]
    },
    {
      id: 'twomoons',
      name: 'Two Moons Music Hall',
      address: '2944 Larimer St',
      description: 'Where culture, community & creativity converge',
      color: 'bg-indigo-600',
      lightColor: 'bg-indigo-100',
      borderColor: 'border-indigo-600',
      links: {
        website: 'https://www.twomoonsmusic.com/',
        instagram: 'https://www.instagram.com/twomoonsmusic/'
      },
      shows: [
        {
          id: 'twomoons-regular',
          time: '6:00 PM - 2:00 AM',
          title: 'Regular Friday Programming',
          description: 'Craft cocktails and live music in RiNo\'s newest venue'
        }
      ]
    },
    {
      id: 'mockingbird',
      name: 'Mockingbird',
      address: 'RiNo Art District',
      description: 'Immersive art lounge and dance club',
      color: 'bg-pink-600',
      lightColor: 'bg-pink-100',
      borderColor: 'border-pink-600',
      links: {
        website: 'https://www.themockingbird.co',
        instagram: 'https://www.instagram.com/mockingbird.denver/'
      },
      shows: [
        {
          id: 'mockingbird-dance',
          time: '9:00 PM - 2:00 AM',
          title: 'Friday Dance Party',
          genre: 'EDM/House/Techno',
          description: 'Dance the night away in chambers inspired by Egypt, Japan, and India'
        }
      ]
    }
  ];

  const toggleShow = (showId) => {
    setExpandedShow(expandedShow === showId ? null : showId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 text-white">
          <h1 className="text-4xl md:text-5xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
            RiNo Music Scene
          </h1>
          <p className="text-xl md:text-2xl text-purple-200">Friday, July 25, 2025</p>
          <p className="mt-2 text-gray-300 max-w-2xl mx-auto">
            Your sonic journey through Denver's River North Art District awaits. Each venue pulses with its own unique rhythm, 
            creating a tapestry of sound that defines the night.
          </p>
        </div>

        {/* UMS Notice */}
        <div className="mb-6 p-4 bg-yellow-900/50 border border-yellow-600 rounded-lg text-yellow-100">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold">Underground Music Showcase Weekend!</p>
              <p className="text-sm mt-1">
                While UMS primarily happens on South Broadway, the energy spreads throughout Denver. 
                This is the festival's 25th and final year in its current form.{' '}
                <a href="https://www.undergroundmusicshowcase.com" target="_blank" rel="noopener noreferrer" 
                   className="underline hover:text-yellow-200">
                  Learn more →
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Time markers */}
          <div className="hidden md:block absolute left-0 top-0 bottom-0 w-24">
            {['5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM', '10:00 PM'].map((time, i) => (
              <div key={time} className="text-gray-400 text-sm" style={{ position: 'absolute', top: `${i * 100}px` }}>
                {time}
              </div>
            ))}
          </div>

          {/* Venues */}
          <div className="md:ml-32 space-y-6">
            {venues.map((venue) => (
              <div key={venue.id} className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
                {/* Venue Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${venue.color}`} />
                      {venue.name}
                    </h2>
                    <p className="text-gray-400 flex items-center gap-2 mt-1">
                      <MapPin className="w-4 h-4" />
                      {venue.address}
                    </p>
                    <p className="text-gray-300 text-sm mt-1 italic">{venue.description}</p>
                  </div>
                  <div className="flex gap-2 mt-3 md:mt-0">
                    {Object.entries(venue.links).map(([key, url]) => (
                      <a
                        key={key}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                        title={key.charAt(0).toUpperCase() + key.slice(1)}
                      >
                        <ExternalLink className="w-4 h-4 text-gray-300" />
                      </a>
                    ))}
                  </div>
                </div>

                {/* Shows */}
                <div className="space-y-3">
                  {venue.shows.map((show) => (
                    <div
                      key={show.id}
                      className={`${venue.lightColor} bg-opacity-10 rounded-lg border ${venue.borderColor} border-opacity-30 overflow-hidden`}
                    >
                      <button
                        onClick={() => toggleShow(show.id)}
                        className="w-full p-4 text-left hover:bg-white/5 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-gray-300">
                              <Clock className="w-4 h-4" />
                              <span className="font-semibold">{show.time}</span>
                            </div>
                            <div>
                              <h3 className="font-bold text-white">{show.title}</h3>
                              {show.ageRestriction && (
                                <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded-full">
                                  {show.ageRestriction}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {show.artists && (
                              <Music className="w-4 h-4 text-gray-400" />
                            )}
                            {expandedShow === show.id ? (
                              <ChevronUp className="w-5 h-5 text-gray-400" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                        </div>
                      </button>

                      {/* Expanded Content */}
                      {expandedShow === show.id && (
                        <div className="px-4 pb-4 space-y-3">
                          {show.description && (
                            <p className="text-gray-300 text-sm">{show.description}</p>
                          )}
                          {show.note && (
                            <p className="text-yellow-300 text-sm italic">{show.note}</p>
                          )}
                          {show.genre && (
                            <p className="text-gray-400 text-sm">Genre: {show.genre}</p>
                          )}
                          
                          {show.artists && (
                            <div className="space-y-3 mt-4">
                              {show.artists.map((artist, idx) => (
                                <div key={idx} className="bg-black/20 rounded-lg p-3">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <h4 className="font-semibold text-white flex items-center gap-2">
                                        <Star className="w-4 h-4 text-yellow-400" />
                                        {artist.name}
                                      </h4>
                                      <p className="text-sm text-gray-400 mt-1">{artist.genre}</p>
                                      {artist.description && (
                                        <p className="text-sm text-gray-300 mt-2">{artist.description}</p>
                                      )}
                                    </div>
                                  </div>
                                  {artist.links && (
                                    <div className="flex gap-2 mt-3 flex-wrap">
                                      {Object.entries(artist.links).map(([platform, url]) => (
                                        <a
                                          key={platform}
                                          href={url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-1 rounded-full transition-colors"
                                        >
                                          {platform}
                                        </a>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Saturday Preview */}
        <div className="mt-8 p-6 bg-gradient-to-r from-purple-800/50 to-pink-800/50 backdrop-blur-sm rounded-xl border border-purple-600">
          <h3 className="text-xl font-bold text-white mb-2">Saturday Preview</h3>
          <p className="text-purple-200">
            Don't miss <strong>Yung Bae</strong> with Pure Colors at Larimer Lounge (6pm, 21+) - 
            Experience the future funk master who transforms '80s city pop into modern dance floor magic!
          </p>
        </div>
      </div>
    </div>
  );
};

export default RiNoMusicCalendar;
