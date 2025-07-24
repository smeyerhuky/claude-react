import React, { useState } from 'react';
import { Music, MapPin, Clock, ExternalLink, ChevronDown, ChevronUp, Star, Info, Coffee, Home } from 'lucide-react';

const DenverMusicNight = () => {
  const [expandedShow, setExpandedShow] = useState(null);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState('all');
  const [hoveredVenue, setHoveredVenue] = useState(null);

  const neighborhoods = {
    rino: {
      name: 'RiNo (River North Art District)',
      description: 'Where industrial grit meets artistic soul',
      color: 'from-purple-600 to-pink-600',
      lightColor: 'from-purple-100 to-pink-100'
    },
    capitolHill: {
      name: 'Capitol Hill',
      description: 'The heartbeat of Denver\'s music heritage',
      color: 'from-blue-600 to-indigo-600',
      lightColor: 'from-blue-100 to-indigo-100',
      landmark: '🥞 Near Jelly Cafe (600 E 13th Ave)'
    },
    southBroadway: {
      name: 'South Broadway (UMS Central)',
      description: 'Underground Music Showcase\'s spiritual home',
      color: 'from-green-600 to-teal-600',
      lightColor: 'from-green-100 to-teal-100'
    }
  };

  const venues = [
    // RiNo Venues
    {
      id: 'larimer',
      neighborhood: 'rino',
      name: 'Larimer Lounge',
      address: '2721 Larimer St',
      description: 'RiNo\'s heritage indie rock club since 2002',
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
      neighborhood: 'rino',
      name: 'Nocturne Jazz & Supper Club',
      address: '1330 27th St',
      description: 'Intimate jazz in an art deco setting',
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
      neighborhood: 'rino',
      name: 'Two Moons Music Hall',
      address: '2944 Larimer St',
      description: 'Where culture, community & creativity converge',
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
      neighborhood: 'rino',
      name: 'Mockingbird',
      address: 'RiNo Art District',
      description: 'Immersive art lounge and dance club',
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
          description: 'Dance in chambers inspired by Egypt, Japan, and India'
        }
      ]
    },
    {
      id: 'globehall',
      neighborhood: 'rino',
      name: 'Globe Hall',
      address: '4483 Logan St',
      description: 'BBQ meets live music in a converted Croatian meeting hall',
      links: {
        website: 'https://globehall.com/',
        instagram: 'https://www.instagram.com/globehalldenver/',
        facebook: 'https://www.facebook.com/GlobeHallDenver/'
      },
      shows: [
        {
          id: 'globehall-show',
          time: '8:00 PM',
          title: 'Live Music',
          description: 'Check venue for artist details'
        }
      ]
    },
    {
      id: 'missionballroom',
      neighborhood: 'rino',
      name: 'Mission Ballroom',
      address: '4242 Wynkoop St',
      description: 'State-of-the-art venue (2,200-3,950 capacity)',
      links: {
        website: 'https://www.missionballroom.com/',
        facebook: 'https://www.facebook.com/missionballroom/'
      },
      shows: [
        {
          id: 'mission-none',
          time: 'Dark Tonight',
          title: 'No scheduled show',
          description: 'Check Saturday for The Dillinger Escape Plan'
        }
      ]
    },
    // Capitol Hill Venues
    {
      id: 'yourmomshouse',
      neighborhood: 'capitolHill',
      name: "Your Mom's House",
      address: '608 E 13th Ave',
      description: 'New ownership in 2025 - focusing on punk rock & metal',
      special: '🥞 Next door to Jelly Cafe!',
      links: {
        website: 'https://yourmomshousedenver.com/',
        instagram: 'https://www.instagram.com/yourmomshousedenver/',
        facebook: 'https://www.facebook.com/yourmomshousedenver/',
        yelp: 'https://www.yelp.com/biz/your-moms-house-denver'
      },
      shows: [
        {
          id: 'ymh-show',
          time: 'Check venue',
          title: 'Punk/Metal Focus',
          description: 'Under new management - check for latest lineup',
          note: 'Happy Hour Mon-Fri 4-8pm: Half off everything!'
        }
      ]
    },
    {
      id: 'ogden',
      neighborhood: 'capitolHill',
      name: 'Ogden Theatre',
      address: '935 E Colfax Ave',
      description: 'Historic 1917 venue, capacity 1,600',
      links: {
        website: 'https://www.ogdentheatre.com/',
        ticketmaster: 'https://www.ticketmaster.com/ogden-theatre-tickets-denver/venue/245772'
      },
      shows: [
        {
          id: 'ogden-none',
          time: 'No show July 25',
          title: 'Check other dates',
          description: 'Olivia Dean on July 30'
        }
      ]
    },
    {
      id: 'fillmore',
      neighborhood: 'capitolHill',
      name: 'Fillmore Auditorium',
      address: '1510 Clarkson St',
      description: 'Lush venue, biggest in Capitol Hill (3,900 capacity)',
      links: {
        website: 'https://www.fillmoreauditorium.org/'
      },
      shows: [
        {
          id: 'fillmore-tbd',
          time: 'Check venue',
          title: 'See website for details'
        }
      ]
    },
    // South Broadway (UMS) Venues
    {
      id: 'hidive',
      neighborhood: 'southBroadway',
      name: 'Hi-Dive',
      address: '7 S Broadway',
      description: 'Divey charm, launching pad for local bands since 2003',
      links: {
        website: 'https://hi-dive.com/',
        songkick: 'https://www.songkick.com/venues/2951-hidive'
      },
      shows: [
        {
          id: 'hidive-ums',
          time: 'UMS Programming',
          title: 'Underground Music Showcase',
          description: 'Part of the 25th & final UMS festival',
          note: 'Check UMS schedule for specific artists'
        }
      ]
    },
    {
      id: 'hq',
      neighborhood: 'southBroadway',
      name: 'HQ',
      address: '60 S Broadway',
      description: 'Former 3 Kings, now HQ Underground',
      links: {
        facebook: 'https://www.facebook.com/hqdenver/'
      },
      shows: [
        {
          id: 'hq-ums',
          time: 'UMS Programming',
          title: 'Underground Music Showcase',
          description: 'Multiple shows throughout the night'
        }
      ]
    },
    {
      id: 'skylark',
      neighborhood: 'southBroadway',
      name: 'Skylark Lounge',
      address: '140 S Broadway',
      description: 'Intimate upstairs venue (75 capacity)',
      links: {
        website: 'https://skylarklounge.com/'
      },
      shows: [
        {
          id: 'skylark-ums',
          time: 'UMS Programming',
          title: 'Underground Music Showcase',
          description: 'Intimate sets from emerging artists'
        }
      ]
    }
  ];

  const filteredVenues = selectedNeighborhood === 'all' 
    ? venues 
    : venues.filter(v => v.neighborhood === selectedNeighborhood);

  const toggleShow = (showId) => {
    setExpandedShow(expandedShow === showId ? null : showId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 text-white">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400">
            Denver's Musical Universe
          </h1>
          <p className="text-xl md:text-2xl text-purple-200">Friday, July 25, 2025</p>
          <p className="mt-4 text-gray-300 max-w-3xl mx-auto">
            From RiNo's artistic soul to Capitol Hill's heritage venues, and South Broadway's underground spirit - 
            your night awaits across Denver's most vibrant neighborhoods. Each venue pulses with its own heartbeat, 
            creating a city-wide symphony of sound.
          </p>
        </div>

        {/* UMS & Special Notes */}
        <div className="mb-6 space-y-4">
          <div className="p-4 bg-yellow-900/50 border border-yellow-600 rounded-lg text-yellow-100">
            <div className="flex items-start gap-3">
              <Star className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-bold text-lg">Underground Music Showcase - Final Year!</p>
                <p className="text-sm mt-1">
                  July 25-27 marks the 25th and final UMS in its current form. While centered on South Broadway, 
                  the festival's energy ripples throughout Denver. Weekend passes $130+.{' '}
                  <a href="https://www.undergroundmusicshowcase.com" target="_blank" rel="noopener noreferrer" 
                     className="underline hover:text-yellow-200">
                    Get tickets →
                  </a>
                </p>
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-purple-900/50 border border-purple-600 rounded-lg text-purple-100">
            <div className="flex items-start gap-3">
              <Coffee className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold">Jelly Cafe Connection</p>
                <p className="text-sm">
                  Capitol Hill location (600 E 13th Ave) is literally next door to Your Mom's House! 
                  Perfect for pre-show breakfast-for-dinner vibes. 🥞
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Neighborhood Filter */}
        <div className="mb-6 flex flex-wrap gap-2 justify-center">
          <button
            onClick={() => setSelectedNeighborhood('all')}
            className={`px-6 py-3 rounded-full font-semibold transition-all ${
              selectedNeighborhood === 'all' 
                ? 'bg-white text-gray-900 shadow-lg' 
                : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
            }`}
          >
            All Neighborhoods
          </button>
          {Object.entries(neighborhoods).map(([key, hood]) => (
            <button
              key={key}
              onClick={() => setSelectedNeighborhood(key)}
              className={`px-6 py-3 rounded-full font-semibold transition-all ${
                selectedNeighborhood === key 
                  ? 'bg-gradient-to-r ' + hood.color + ' text-white shadow-lg' 
                  : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
              }`}
            >
              {hood.name}
            </button>
          ))}
        </div>

        {/* Venues by Neighborhood */}
        <div className="space-y-8">
          {Object.entries(neighborhoods).map(([nhKey, neighborhood]) => {
            const nhVenues = filteredVenues.filter(v => v.neighborhood === nhKey);
            if (nhVenues.length === 0) return null;

            return (
              <div key={nhKey} className="space-y-4">
                <div className={`p-4 rounded-lg bg-gradient-to-r ${neighborhood.color} bg-opacity-20 backdrop-blur-sm`}>
                  <h2 className="text-2xl font-bold text-white">{neighborhood.name}</h2>
                  <p className="text-gray-300">{neighborhood.description}</p>
                  {neighborhood.landmark && (
                    <p className="text-sm text-gray-300 mt-1">{neighborhood.landmark}</p>
                  )}
                </div>

                {nhVenues.map((venue) => (
                  <div 
                    key={venue.id} 
                    className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-colors"
                    onMouseEnter={() => setHoveredVenue(venue.id)}
                    onMouseLeave={() => setHoveredVenue(null)}
                  >
                    {/* Venue Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                      <div>
                        <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                          {venue.name}
                          {venue.special && (
                            <span className="text-sm font-normal text-yellow-300">{venue.special}</span>
                          )}
                        </h3>
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
                          className={`rounded-lg border border-gray-600 overflow-hidden transition-all ${
                            hoveredVenue === venue.id ? 'border-purple-500' : ''
                          }`}
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
                                  <h4 className="font-bold text-white">{show.title}</h4>
                                  {show.ageRestriction && (
                                    <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded-full ml-2">
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
                            <div className="px-4 pb-4 space-y-3 bg-black/20">
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
                                    <div key={idx} className="bg-black/30 rounded-lg p-3">
                                      <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                          <h5 className="font-semibold text-white flex items-center gap-2">
                                            <Star className="w-4 h-4 text-yellow-400" />
                                            {artist.name}
                                          </h5>
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
            );
          })}
        </div>

        {/* Saturday Preview */}
        <div className="mt-8 p-6 bg-gradient-to-r from-purple-800/50 to-pink-800/50 backdrop-blur-sm rounded-xl border border-purple-600">
          <h3 className="text-xl font-bold text-white mb-2">Saturday Preview</h3>
          <p className="text-purple-200">
            Don't miss <strong>Yung Bae</strong> with Pure Colors at Larimer Lounge (6pm, 21+) - 
            Experience the future funk master who transforms '80s city pop into modern dance floor magic!
          </p>
        </div>

        {/* Navigation Tips */}
        <div className="mt-6 p-4 bg-gray-800/50 rounded-lg text-gray-300 text-sm">
          <p className="font-semibold mb-2">🗺️ Navigation Notes:</p>
          <ul className="space-y-1">
            <li>• RiNo & Capitol Hill are about 15-20 min apart by car/rideshare</li>
            <li>• South Broadway (UMS area) is south of downtown, separate from RiNo</li>
            <li>• Your Mom's House & Jelly Cafe are literally neighbors - perfect combo!</li>
            <li>• Many venues are walkable within their neighborhoods</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DenverMusicNight;
