// lookup table with version specific configuration

// Each entry is an array of lookup pattern objects
// Each lookup pattern object must have three keys:
// versions (semver string), offsets, signatures

module.exports =
{
    playerstate: [
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
                world: [0x120, 'uint32'],
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