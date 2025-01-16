// lookup table with version specific configuration

// Each entry is an array of lookup pattern objects
// Each lookup pattern object must have three keys:
// versions (semver string), offsets, signatures

module.exports =
{
    playerstateHeuristic: [
        {
            // version: version numbers matching the pattern and positions
            versions: ">=1.65.0",
            // offsets: field configuration
            offsets: {
                // Relative position to player (the baseaddress)
                player: [0x0, 'uint32'],
                timestamp: [0x8, 'uint32'], // unit ms 
                distance: [0x10, 'uint32'], // unit m
                roadtime: [0x14, 'uint32'], // position on road (subtract 5,000 and divide by 1,000,000 to get actual roadtime)
                laps: [0x18, 'int32'], 
                speed: [0x1c, 'uint32'], // unit mm/h
                cadence_uHz: [0x28, 'uint32'], // unit uHz
                draft: [0x2c, 'int32'],
                heartrate: [0x30, 'uint32'], // unit bpm
                power: [0x34, 'uint32'], // unit W
                climbing: [0x40, 'uint32'], // 0x10 or 0x118
                time: [0x44, 'uint32'], // unit s // time on course (excluding lead-in and pedal assist)
                f19: [0x50, 'uint32'], 
                f20: [0x54, 'uint32'], 
                work: [0x64, 'uint32'],  // unit mWh
                x: [0x68, 'float'], 
                altitude: [0x6c, 'float'], 
                y: [0x80, 'float'], 
                watching: [0x70, 'uint32'],
                eventDistance: [0x90, 'float'], // unit cm
                groupId: [0x78, 'uint32'],
                courseId: [0x94, 'uint32'],
                routeId: [0xa4, 'uint32'],
                world: [0x108, 'uint32'],
            },
            // signatures: patterns to search for
            signatures: [
                {
                    pattern: '<player> 00 00 00 00',
                    heuristic: {
                        min: 8 + 20 * 4,
                        max: 8 + 36 * 4,
                        mustMatch: [],
                        mustDiffer: [8],
                        mustBeGreaterThanEqual: {
                            power: [0x34, 'uint32', 0], // offset, type, value
                            heartrate: [0x30, 'uint32', 0], // offset, type, value
                        },
                        mustBeLessThanEqual: {
                            power: [0x34, 'uint32', 2000], // offset, type, value
                            heartrate: [0x30, 'uint32', 300], // offset, type, value
                        },
                        
                    },
                    addressOffset: 0 // baseaddress offset to start of found pattern (the first occurence of pattern where was another occurrence between min and max before it)
                },
            ],
        },
    ],
    
    playerstate: [
        {
            // version: version numbers matching the pattern and positions
            versions: ">=1.65.0",
            // offsets: field configuration
            offsets: {
                // Relative position to player (the baseaddress)
                climbing: [0x40, 'uint32'], // 0x10 or 0x118
                speed: [0x1c, 'uint32'],
                distance: [0x10, 'uint32'],
                time: [0x44, 'uint32'],
                cadence_uHz: [0x28, 'uint32'], // unit uHz
                heartrate: [0x30, 'uint32'],
                power: [0x34, 'uint32'],
                player: [0x0, 'uint32'],
                x: [0x68, 'float'], 
                y: [0x80, 'float'], 
                altitude: [0x6c, 'float'], 
                watching: [0x70, 'uint32'],
                groupId: [0x78, 'uint32'],
                routeId: [0xa4, 'uint32'],
                world: [0x108, 'uint32'],
                work: [ 0x64, 'uint32' ],  // unit mWh
            },
            // signatures: patterns to search for
            signatures: [
                {
                    pattern: [
                        '<player>',
                        Array(1).fill('00 00 00 00').join(' '),
                        Array(28).fill('? ? ? ?').join(' '),
                        '<player>',
                        Array(1).fill('00 00 00 00').join(' ')
                    ].join(' '), // matches 1.65 in initial testing.
                    addressOffset: (1+1+28)*4 // baseaddress offset to start of found pattern
                },
            ],
        },
        {
            // version: version numbers matching the pattern and positions
            versions: ">=1.56.0",
            // offsets: field configuration
            offsets: {
                // Relative position to player (the baseaddress)
                climbing: [0x40, 'uint32'], // 0x10 or 0x118
                speed: [0x1c, 'uint32'],
                distance: [0x10, 'uint32'],
                time: [0x44, 'uint32'],
                cadence_uHz: [0x28, 'uint32'], // unit uHz
                heartrate: [0x30, 'uint32'],
                power: [0x34, 'uint32'],
                player: [0x0, 'uint32'],
                x: [0x68, 'float'], 
                y: [0x80, 'float'], 
                altitude: [0x6c, 'float'], 
                watching: [0x70, 'uint32'],
                world: [0x108, 'uint32'],
                work: [ 0x64, 'uint32' ],  // unit mWh
            },
            // signatures: patterns to search for
            signatures: [
                {
                    pattern: '<player> 00 00 00 00 ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 <player> 00 00 00 00', // matches 1.56 in initial testing.
                    addressOffset: 8+16*4+4*4+8 // baseaddress offset to start of found pattern
                },
                {
                    pattern: '<player> 00 00 00 00 ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? 00 00 00 00 00 00 00 00 <player> 00 00 00 00', // fallback patterne for 1.56 should the extra segment before the last <player> not be all 0 anyway.
                    addressOffset: 8+16*4+4*4+8 // baseaddress offset to start of found pattern
                },
                {
                    pattern: '<player> 00 00 00 00 ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? 00 00 00 00 00 00 00 00 <player> 00 00 00 00', // matches 1.39 in all cases (and hopefully next versions, too). No more than 1-2 sec. slower than next pattern.
                    addressOffset: 8+16*4+8 // baseaddress offset to start of found pattern
                },
                {
                    pattern: '<player> 00 00 00 00 ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? 00 00 00 00 00 00 00 00 <player> 00 00 00 00', // matches 1.39 in all cases (and hopefully next versions, too). No more than 1-2 sec. slower than next pattern.
                    addressOffset: 8+18*4+8 // baseaddress offset to start of found pattern
                },
                {
                    pattern: 'EF 00 00 00 00 00 00 00 00 00 00 00 <player> 00 00 00 00', // matches 1.39 when started riding
                    addressOffset: 12 // baseaddress offset to start of found pattern
                },
                {
                    pattern: '6F 00 00 00 00 00 00 00 00 00 00 00 <player> 00 00 00 00', // matches 1.39 while in initial screens
                    addressOffset: 12 // baseaddress offset to start of found pattern
                },
            ],
        },
        {
            // version: version numbers matching the pattern and positions
            versions: ">=1.49.0",
            // offsets: field configuration
            offsets: {
                // Relative position to player (the baseaddress)
                climbing: [0x40, 'uint32'],
                speed: [0x1c, 'uint32'],
                distance: [0x10, 'uint32'],
                time: [0x44, 'uint32'],
                cadence_uHz: [0x28, 'uint32'], // unit uHz
                heartrate: [0x30, 'uint32'],
                power: [0x34, 'uint32'],
                player: [0x0, 'uint32'],
                x: [0x68, 'float'], 
                y: [0x80, 'float'], 
                altitude: [0x6c, 'float'], 
                watching: [0x70, 'uint32'],
                world: [0x108, 'uint32'],
                work: [ 0x64, 'uint32' ],  // unit mWh
            },
            // signatures: patterns to search for
            signatures: [
                {
                    pattern: '<player> 00 00 00 00 ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? 00 00 00 00 00 00 00 00 <player> 00 00 00 00', // matches 1.39 in all cases (and hopefully next versions, too). No more than 1-2 sec. slower than next pattern.
                    addressOffset: 8+16*4+8 // baseaddress offset to start of found pattern
                },
                {
                    pattern: '<player> 00 00 00 00 ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? 00 00 00 00 00 00 00 00 <player> 00 00 00 00', // matches 1.39 in all cases (and hopefully next versions, too). No more than 1-2 sec. slower than next pattern.
                    addressOffset: 8+18*4+8 // baseaddress offset to start of found pattern
                },
                {
                    pattern: 'EF 00 00 00 00 00 00 00 00 00 00 00 <player> 00 00 00 00', // matches 1.39 when started riding
                    addressOffset: 12 // baseaddress offset to start of found pattern
                },
                {
                    pattern: '6F 00 00 00 00 00 00 00 00 00 00 00 <player> 00 00 00 00', // matches 1.39 while in initial screens
                    addressOffset: 12 // baseaddress offset to start of found pattern
                },
            ],
        },
        {
            // version: version numbers matching the pattern and positions
            versions: ">=1.48.0",
            // offsets: field configuration
            offsets: {
                // Relative position to player (the baseaddress)
                // Here calculated as the field specific offset used in MOV minus 0x20 (offset for player in MOV)
                climbing: [0x60 - 0x20, 'uint32'],
                speed: [0x3c - 0x20, 'uint32'],
                distance: [0x30 - 0x20, 'uint32'],
                time: [0x64 - 0x20, 'uint32'],
                cadence_uHz: [0x48 - 0x20, 'uint32'], // unit uHz
                heartrate: [0x50 - 0x20, 'uint32'],
                power: [0x54 - 0x20, 'uint32'],
                player: [0x20 - 0x20, 'uint32'],
                x: [0x88 - 0x20, 'float'], 
                y: [0xa0 - 0x20, 'float'], 
                altitude: [0x8c - 0x20, 'float'], 
                watching: [0x90 - 0x20, 'uint32'],
                world: [6 * 0x28 + 0x10, 'uint32'],
                work: [ 0x84 - 0x20, 'uint32' ],  // unit mWh
            },
            // signatures: patterns to search for
            signatures: [
                {
                    pattern: '<player> 00 00 00 00 ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? 00 00 00 00 00 00 00 00 <player> 00 00 00 00', // matches 1.39 in all cases (and hopefully next versions, too). No more than 1-2 sec. slower than next pattern.
                    addressOffset: 8+16*4+8 // baseaddress offset to start of found pattern
                },
                {
                    pattern: '<player> 00 00 00 00 ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? 00 00 00 00 00 00 00 00 <player> 00 00 00 00', // matches 1.39 in all cases (and hopefully next versions, too). No more than 1-2 sec. slower than next pattern.
                    addressOffset: 8+18*4+8 // baseaddress offset to start of found pattern
                },
                {
                    pattern: 'EF 00 00 00 00 00 00 00 00 00 00 00 <player> 00 00 00 00', // matches 1.39 when started riding
                    addressOffset: 12 // baseaddress offset to start of found pattern
                },
                {
                    pattern: '6F 00 00 00 00 00 00 00 00 00 00 00 <player> 00 00 00 00', // matches 1.39 while in initial screens
                    addressOffset: 12 // baseaddress offset to start of found pattern
                },
            ],
        },
        {
            // version: version numbers matching the pattern and positions
            versions: ">=1.42.0",
            // offsets: field configuration
            offsets: {
                // Relative position to player (the baseaddress)
                // Here calculated as the field specific offset used in MOV minus 0x20 (offset for player in MOV)
                climbing: [0x60 - 0x20, 'uint32'],
                speed: [0x3c - 0x20, 'uint32'],
                distance: [0x30 - 0x20, 'uint32'],
                time: [0x64 - 0x20, 'uint32'],
                cadence_uHz: [0x48 - 0x20, 'uint32'], // unit uHz
                heartrate: [0x50 - 0x20, 'uint32'],
                power: [0x54 - 0x20, 'uint32'],
                player: [0x20 - 0x20, 'uint32'],
                x: [0x88 - 0x20, 'float'], 
                y: [0xa0 - 0x20, 'float'], 
                altitude: [0x8c - 0x20, 'float'], 
                watching: [0x90 - 0x20, 'uint32'],
                world: [0x110 - 0x20, 'uint32'],
                work: [ 0x84 - 0x20, 'uint32' ],  // unit mWh
            },
            // signatures: patterns to search for
            signatures: [
                {
                    pattern: '<player> 00 00 00 00 ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? 00 00 00 00 00 00 00 00 <player> 00 00 00 00', // matches 1.39 in all cases (and hopefully next versions, too). No more than 1-2 sec. slower than next pattern.
                    addressOffset: 8+16*4+8 // baseaddress offset to start of found pattern
                },
                {
                    pattern: '<player> 00 00 00 00 ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? 00 00 00 00 00 00 00 00 <player> 00 00 00 00', // matches 1.39 in all cases (and hopefully next versions, too). No more than 1-2 sec. slower than next pattern.
                    addressOffset: 8+18*4+8 // baseaddress offset to start of found pattern
                },
                {
                    pattern: 'EF 00 00 00 00 00 00 00 00 00 00 00 <player> 00 00 00 00', // matches 1.39 when started riding
                    addressOffset: 12 // baseaddress offset to start of found pattern
                },
                {
                    pattern: '6F 00 00 00 00 00 00 00 00 00 00 00 <player> 00 00 00 00', // matches 1.39 while in initial screens
                    addressOffset: 12 // baseaddress offset to start of found pattern
                },
            ],
        },
        {
            // version: version numbers matching the pattern and positions
            versions: ">=1.39.0",
            // offsets: field configuration
            offsets: {
                // Relative position to player (the baseaddress)
                // Here calculated as the field specific offset used in MOV minus 0x20 (offset for player in MOV)
                climbing: [0x60 - 0x20, 'uint32'],
                speed: [0x3c - 0x20, 'uint32'],
                distance: [0x30 - 0x20, 'uint32'],
                time: [0x64 - 0x20, 'uint32'],
                cadence_uHz: [0x48 - 0x20, 'uint32'], // unit uHz
                heartrate: [0x50 - 0x20, 'uint32'],
                power: [0x54 - 0x20, 'uint32'],
                player: [0x20 - 0x20, 'uint32'],
                x: [0x88 - 0x20, 'float'], 
                y: [0xa0 - 0x20, 'float'], 
                altitude: [0x8c - 0x20, 'float'], 
                watching: [0x90 - 0x20, 'uint32'],
                world: [0x110 - 0x20, 'uint32'],
                work: [ 0x84 - 0x20, 'uint32' ],  // unit mWh
            },
            // signatures: patterns to search for
            signatures: [
                {
                    pattern: '<player> 00 00 00 00 ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? 00 00 00 00 00 00 00 00 <player> 00 00 00 00', // matches 1.39 in all cases (and hopefully next versions, too). No more than 1-2 sec. slower than next pattern.
                    addressOffset: 8+18*4+8 // baseaddress offset to start of found pattern
                },
                {
                    pattern: 'EF 00 00 00 00 00 00 00 00 00 00 00 <player> 00 00 00 00', // matches 1.39 when started riding
                    addressOffset: 12 // baseaddress offset to start of found pattern
                },
                {
                    pattern: '6F 00 00 00 00 00 00 00 00 00 00 00 <player> 00 00 00 00', // matches 1.39 while in initial screens
                    addressOffset: 12 // baseaddress offset to start of found pattern
                },
            ],
        },
        {
            // version: version numbers matching the pattern and positions
            versions: ">=1.31.0",
            // offsets: field configuration
            offsets: {
                // Relative position to player (the baseaddress)
                // Here calculated as the field specific offset used in MOV minus 0x20 (offset for player in MOV)
                climbing: [0x60 - 0x20, 'uint32'],
                speed: [0x3c - 0x20, 'uint32'],
                distance: [0x30 - 0x20, 'uint32'],
                time: [0x64 - 0x20, 'uint32'],
                cadence_uHz: [0x48 - 0x20, 'uint32'], // unit uHz
                heartrate: [0x50 - 0x20, 'uint32'],
                power: [0x54 - 0x20, 'uint32'],
                player: [0x20 - 0x20, 'uint32'],
                x: [0x88 - 0x20, 'float'], 
                y: [0xa0 - 0x20, 'float'], 
                altitude: [0x8c - 0x20, 'float'], 
                watching: [0x90 - 0x20, 'uint32'],
                world: [0x110 - 0x20, 'uint32'],
                work: [ 0x84 - 0x20, 'uint32' ],  // unit mWh
            },
            // signatures: pattern to search for
            signatures: [
                {
                    start: '3B 00 00 00 00 00 00 00 00 00 00 00',
                    end: '00 00 00 00',
                    addressOffset: 12
                }
            ],
        },
        {
            // version: version numbers matching the pattern and positions
            versions: "*",
            // offsets: field configuration
            offsets: {
                // Relative position to player (the baseaddress)
                // Here calculated as the field specific offset used in MOV minus 0x20 (offset for player in MOV)
                climbing: [0x60 - 0x20, 'uint32'],
                speed: [0x3c - 0x20, 'uint32'],
                distance: [0x30 - 0x20, 'uint32'],
                time: [0x64 - 0x20, 'uint32'],
                cadence_uHz: [0x48 - 0x20, 'uint32'], // unit uHz
                heartrate: [0x50 - 0x20, 'uint32'],
                power: [0x54 - 0x20, 'uint32'],
                player: [0x20 - 0x20, 'uint32'],
                x: [0x88 - 0x20, 'float'], 
                y: [0xa0 - 0x20, 'float'], 
                altitude: [0x8c - 0x20, 'float'], 
                watching: [0x90 - 0x20, 'uint32'],
                world: [0x110 - 0x20, 'uint32'],
                work: [0x84 - 0x20, 'uint32'],  // unit mWh
            },
            // signatures: pattern to search for
            signatures: [
                {
                    start: '1E 00 00 00 00 00 00 00 00 00 00 00',
                    end: '00 00 00 00',
                    addressOffset: 12
                }
            ],
        }
    ],
    
    playerprofile: [
        {
            versions: "*",
            offsets: {
                weight: [4*4, 'uint32'], // g
                ftp: [5*4, 'uint32'], // W
                bodyType: [7*4, 'uint32'], // 
                height: [42*4, 'uint32'], // mm
                maxhr: [43*4, 'uint32'], // bpm
                drops: [45*4, 'uint32'], // 
                achievementLevel: [46*4, 'uint32'], // 
                age: [51*4, 'uint32'], // 
            },
            signatures: [
                {
                    start: '00 00 00 00 00 00 00 00',
                    // end: '00 00 00 00 ? 00 00 00 00 00 00 00 ? ? ? 00 ? ? 00 00 00 00 00 00',
                    end: '00 00 00 00 00 00 00 00 00 00 00 00 ? ? ? 00 ? ? 00 00 00 00 00 00',
                    // end: '00 00 00 00 01 00 00 00 00 00 00 00',
                    addressOffset: 8
                }
            ],
        },
        
    ]
}