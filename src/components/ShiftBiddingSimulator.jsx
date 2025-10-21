import { useState, useMemo } from 'react';
import { Filter, Users, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

export default function ShiftBiddingSimulator() {
  const [mySeniority, setMySeniority] = useState('');
  const [rawData, setRawData] = useState('');
  const [parsedData, setParsedData] = useState([]);
  const [maxBids, setMaxBids] = useState('65');

  // Parse pasted data
  const handleDataPaste = (text) => {
    setRawData(text);
    try {
      const lines = text.trim().split('\n');
      const data = [];
      
      lines.forEach(line => {
        const parts = line.includes(',') ? line.split(',') : line.split('\t');
        if (parts.length >= 3) {
          const seniority = parts[0].trim();
          const crewId = parts[1].trim();
          const bidsText = parts[2].trim().replace(/"/g, '');
          const bids = bidsText.split(/\s+/).filter(b => b && b !== '');
          
          if (seniority && !isNaN(seniority) && bids.length > 0) {
            data.push({
              seniority: parseInt(seniority),
              crewId,
              bids
            });
          }
        }
      });
      
      setParsedData(data.sort((a, b) => a.seniority - b.seniority));
    } catch (error) {
      console.error('Error parsing:', error);
    }
  };

  // Calculate what gets taken by higher seniority and what's available to me
  const sieveAnalysis = useMemo(() => {
    if (!mySeniority || parsedData.length === 0) return null;

    const mySen = parseInt(mySeniority);
    const maxBidCount = parseInt(maxBids) || 65;
    const takenBids = new Set();
    const assignments = [];
    let myTurn = false;
    
    // Process each crew member in seniority order
    for (const crew of parsedData) {
      if (crew.seniority === mySen) {
        myTurn = true;
        break;
      }
      
      // Find first available bid for this crew member
      for (const bid of crew.bids) {
        const bidNum = parseInt(bid);
        if (!takenBids.has(bid) && bidNum <= maxBidCount) {
          takenBids.add(bid);
          assignments.push({
            seniority: crew.seniority,
            crewId: crew.crewId,
            took: bid,
            wantedBids: crew.bids
          });
          break;
        }
      }
    }

    // Get all unique bids from the dataset (within max limit)
    const allBids = new Set();
    parsedData.forEach(crew => {
      crew.bids.forEach(bid => {
        const bidNum = parseInt(bid);
        if (bidNum <= maxBidCount) {
          allBids.add(bid);
        }
      });
    });

    // What's still available when it's my turn
    const availableBids = Array.from(allBids)
      .filter(bid => !takenBids.has(bid))
      .sort((a, b) => parseInt(a) - parseInt(b));

    return {
      takenBids: Array.from(takenBids).sort((a, b) => parseInt(a) - parseInt(b)),
      availableBids,
      assignments,
      totalBids: allBids.size,
      maxBidCount
    };
  }, [mySeniority, parsedData, maxBids]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Filter className="text-blue-600" size={36} />
            <h1 className="text-3xl font-bold text-gray-900">Bid Sieve</h1>
          </div>
          <p className="text-gray-600">See what's left when it's your turn to pick</p>
        </div>

        {/* Input Section */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          
          {/* Your Seniority */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <label className="block">
              <div className="flex items-center gap-2 mb-3">
                <Users className="text-blue-600" size={20} />
                <span className="text-lg font-bold text-gray-800">Your Seniority</span>
              </div>
              <input
                type="number"
                value={mySeniority}
                onChange={(e) => setMySeniority(e.target.value)}
                placeholder="Enter your number (e.g., 1827)"
                className="w-full text-2xl p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              />
            </label>
          </div>

          {/* Max Bids Guard */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <label className="block">
              <div className="flex items-center gap-2 mb-3">
                <Filter className="text-blue-600" size={20} />
                <span className="text-lg font-bold text-gray-800">Max Bid Number</span>
              </div>
              <input
                type="number"
                value={maxBids}
                onChange={(e) => setMaxBids(e.target.value)}
                placeholder="65"
                className="w-full text-2xl p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              />
              <p className="text-xs text-gray-500 mt-2">Only consider bids ≤ this number</p>
            </label>
          </div>

          {/* Data Input */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="mb-3">
              <span className="text-lg font-bold text-gray-800">Paste Bid Data</span>
              <p className="text-sm text-gray-500">CSV format: Seniority, CrewId, Bids</p>
            </div>
            <textarea
              value={rawData}
              onChange={(e) => handleDataPaste(e.target.value)}
              placeholder="49,0554444,64 46 47 48&#10;417,0556218,34 35&#10;525,1114238,64 54 21"
              className="w-full h-32 p-3 border-2 border-gray-300 rounded-lg font-mono text-sm focus:border-blue-500 focus:outline-none"
            />
            {parsedData.length > 0 && (
              <p className="mt-2 text-green-600 font-semibold flex items-center gap-2">
                <CheckCircle size={18} />
                {parsedData.length} crew members loaded
              </p>
            )}
          </div>
        </div>

        {/* Results */}
        {sieveAnalysis && (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-xl shadow-lg p-6 text-center">
                <p className="text-sm text-gray-600 mb-1">Total Bids (≤{sieveAnalysis.maxBidCount})</p>
                <p className="text-4xl font-bold text-blue-600">{sieveAnalysis.totalBids}</p>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6 text-center">
                <p className="text-sm text-gray-600 mb-1">Already Taken</p>
                <p className="text-4xl font-bold text-red-600">{sieveAnalysis.takenBids.length}</p>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6 text-center">
                <p className="text-sm text-gray-600 mb-1">Still Available</p>
                <p className="text-4xl font-bold text-green-600">{sieveAnalysis.availableBids.length}</p>
              </div>
            </div>

            {/* Available Bids */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <CheckCircle className="text-green-600" size={28} />
                Available When It's Your Turn
              </h2>
              
              {sieveAnalysis.availableBids.length > 0 ? (
                <div className="grid grid-cols-8 sm:grid-cols-10 md:grid-cols-12 lg:grid-cols-15 gap-2">
                  {sieveAnalysis.availableBids.map(bid => (
                    <div
                      key={bid}
                      className="aspect-square flex items-center justify-center bg-green-100 border-2 border-green-400 rounded-lg font-bold text-lg text-green-800 hover:bg-green-200 transition-colors"
                    >
                      {bid}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <AlertTriangle size={48} className="mx-auto mb-2" />
                  <p className="text-lg">No bids available at your seniority level</p>
                </div>
              )}
            </div>

            {/* Taken Bids */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <XCircle className="text-red-600" size={28} />
                Already Taken by Higher Seniority
              </h2>
              
              {sieveAnalysis.takenBids.length > 0 ? (
                <div className="grid grid-cols-8 sm:grid-cols-10 md:grid-cols-12 lg:grid-cols-15 gap-2">
                  {sieveAnalysis.takenBids.map(bid => (
                    <div
                      key={bid}
                      className="aspect-square flex items-center justify-center bg-red-100 border-2 border-red-400 rounded-lg font-bold text-lg text-red-800 opacity-60"
                    >
                      {bid}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">You're first! Nothing taken yet.</p>
              )}
            </div>

            {/* Assignment History */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Who Took What (In Order)</h2>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-3 text-left font-bold">Order</th>
                      <th className="p-3 text-left font-bold">Seniority</th>
                      <th className="p-3 text-left font-bold">Crew ID</th>
                      <th className="p-3 text-left font-bold">Took</th>
                      <th className="p-3 text-left font-bold">Their Full Bid List</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sieveAnalysis.assignments.map((assignment, idx) => (
                      <tr key={idx} className="border-t hover:bg-gray-50">
                        <td className="p-3 font-semibold text-gray-600">#{idx + 1}</td>
                        <td className="p-3 font-semibold">{assignment.seniority}</td>
                        <td className="p-3 font-mono text-sm">{assignment.crewId}</td>
                        <td className="p-3">
                          <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full font-bold">
                            {assignment.took}
                          </span>
                        </td>
                        <td className="p-3 text-gray-600 font-mono text-xs">
                          {assignment.wantedBids.map((bid, i) => (
                            <span
                              key={i}
                              className={`mr-1 ${bid === assignment.took ? 'font-bold text-red-600' : ''}`}
                            >
                              {bid}
                            </span>
                          ))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                <p className="text-sm text-gray-700">
                  <strong>Your turn is next!</strong> Choose from the {sieveAnalysis.availableBids.length} available bids shown above.
                </p>
              </div>
            </div>
          </>
        )}

        {/* Help Text */}
        {!sieveAnalysis && parsedData.length === 0 && (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <Filter className="mx-auto mb-4 text-gray-400" size={64} />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">How It Works</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Enter your seniority number and paste the bid data. 
              The sieve will show you exactly which bids are still available 
              when it's your turn to choose, after everyone with higher seniority 
              (lower numbers) has taken their first available choice.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}