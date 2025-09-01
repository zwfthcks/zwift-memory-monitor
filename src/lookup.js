// lookup table with version specific configuration

// each export is a named pattern 

// Each entry is an array of lookup pattern objects
// Each lookup pattern object must have four keys:
// type, versions (semver string), offsets, signatures

const patterns = 
{
    playerstate: [
        {
            type: 'playerstate',
            // version: version numbers matching the pattern and positions
            versions: ">=1.94.0",
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
                checkPointId: [0x98, 'uint32'],
                routeId: [0xa4, 'uint32'],
                gradientScale: [0xc0, 'uint32'], // 0 ~ 50%, 1 ~ 75%, 2 ~ 100%, 3 ~ 125%  
                elevationScalePct: [0xc4, 'uint32'], // 50, 75, 100, 125
                // world: [0x110, 'uint32'],
            },
            units: {
                timestamp: 'ms',
                distance: 'm',
                elevation: 'm',
                speed: 'mm/h',
                power: 'W',
                heartrate: 'bpm',
                cadence_uHz: 'uHz',
                time: 's',
                work: 'mWh',
                eventDistance: 'cm',
                altitude: 'cm',
            },
            // signatures: patterns to search for
            signatures: [
                {
                    pattern: '<player> 00 00 00 00',
                    rules: {
                        mustRepeatAt: {
                            min: 8 + 20 * 4,
                            max: 8 + 36 * 4,
                        },
                        mustBeVariable: [
                            // [0x48, 'uint32', '<sport>'], // offset, type, variable
                            // [0x110, 'uint32', '<world>'], // offset, type, variable
                            [0x94, 'uint32', '<course>'], // offset, type, variable
                        ],
                        mustMatch: [],
                        mustDiffer: [8],
                        mustBeGreaterThanEqual: {
                            power: [0x34, 'uint32', 0], // offset, type, value
                            heartrate: [0x30, 'uint32', 0], // offset, type, value
                            speed: [0x1c, 'uint32', 0], // offset, type, value
                            cadence_uHz: [0x28, 'uint32', 0], // offset, type, value
                            // world: [0x110, 'uint32', 0], // offset, type, variable
                            course: [0x94, 'uint32', 0], // offset, type, variable
                        },
                        mustBeLessThanEqual: {
                            power: [0x34, 'uint32', 2000], // offset, type, value
                            heartrate: [0x30, 'uint32', 300], // offset, type, value
                            speed: [0x1c, 'uint32', 100 * 1000 * 1000], // offset, type, value
                            cadence_uHz: [0x28, 'uint32', 150 * 1000000 / 60], // offset, type, value
                            // world: [0x110, 'uint32', 14], // offset, type, variable
                            course: [0x94, 'uint32', 18], // offset, type, variable
                        },
                        
                    },
                    addressOffset: 0 // baseaddress offset to start of found pattern (the first occurence of pattern where was another occurrence between min and max before it)
                },
            ],
        },
        {
            type: 'playerstate',
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
                checkPointId: [0x98, 'uint32'],
                routeId: [0xa4, 'uint32'],
                gradientScale: [0xb8, 'uint32'], // 0 ~ 50%, 1 ~ 75%, 2 ~ 100%, 3 ~ 125%
                elevationScalePct: [0xbc, 'uint32'], // 50, 75, 100, 125
                world: [0x108, 'uint32'],
            },
            units: {
                timestamp: 'ms',
                distance: 'm',
                elevation: 'm',
                speed: 'mm/h',
                power: 'W',
                heartrate: 'bpm',
                cadence_uHz: 'uHz',
                time: 's',
                work: 'mWh',
                eventDistance: 'cm',
            },
            // signatures: patterns to search for
            signatures: [
                {
                    pattern: '<player> 00 00 00 00',
                    rules: {
                        mustRepeatAt: {
                            min: 8 + 20 * 4,
                            max: 8 + 36 * 4,
                        },
                        mustBeVariable: [
                            // [0x48, 'uint32', '<sport>'], // offset, type, variable
                            [0x108, 'uint32', '<world>'], // offset, type, variable
                        ],
                        mustMatch: [],
                        mustDiffer: [8],
                        mustBeGreaterThanEqual: {
                            power: [0x34, 'uint32', 0], // offset, type, value
                            heartrate: [0x30, 'uint32', 0], // offset, type, value
                            speed: [0x1c, 'uint32', 0], // offset, type, value
                            cadence_uHz: [0x28, 'uint32', 0], // offset, type, value
                        },
                        mustBeLessThanEqual: {
                            power: [0x34, 'uint32', 2000], // offset, type, value
                            heartrate: [0x30, 'uint32', 300], // offset, type, value
                            speed: [0x1c, 'uint32', 100 * 1000 * 1000], // offset, type, value
                            cadence_uHz: [0x28, 'uint32', 150 * 1000000 / 60], // offset, type, value
                        },
                        
                    },
                    addressOffset: 0 // baseaddress offset to start of found pattern (the first occurence of pattern where was another occurrence between min and max before it)
                },
            ],
        },
    ],
    
    playerprofile: [
        {
            type: 'playerprofile',
            versions: "*",
            offsets: {
                weight: [4*4, 'uint32'], // g
                ftp: [5*4, 'uint32'], // W
                bodyType: [7*4, 'uint32'], // 
                jersey: [15*4, 'uint32'], //
                flag: [34 * 4, 'uint32'], //
                height: [42*4, 'uint32'], // mm
                maxhr: [43*4, 'uint32'], // bpm
                drops: [45*4, 'uint32'], // 
                achievementLevel: [46*4, 'uint32'], // 
                age: [51 * 4, 'uint32'], // 
            },
            units: {
                weight: 'g',
                ftp: 'W',
                height: 'mm',
                maxhr: 'bpm',
            },
            signatures: [
                {
                    // pattern: '<player> 00 00 00 00 ' + Array(7*4).fill('? ? ? ?').join(' ') + ' <flag>',
                    pattern: '<player> 00 00 00 00 ',
                    rules: {
                        mustBeVariable: [
                            [ 15 * 4, 'uint32', '<jersey>' ],
                        ]
                    },
                    mustBeGreaterThanEqual: {
                            jersey: [15*4, 'uint32', 1], // offset, type, value
                            height: [42*4, 'uint32', 1], // offset, type, value
                            maxhr: [43*4, 'uint32', 1], // offset, type, value
                    },
                    addressOffset: 0
                }
            ],
        },
        
    ],

    testappHit: [
        {
            type: 'testapp',
            versions: "*",
            offsets: {
                test: [8, 'uint32'],
                zero: [12, 'uint32'],
            },
            signatures: [
                {
                    pattern: '54 45 53 54 41 50 50 21',
                    rules: {},
                    addressOffset: 0
                }
            ],
        }
    ],

    testappMiss: [
        {
            type: 'testapp',
            versions: "*",
            offsets: {
                test: [8, 'uint32'],
                zero: [12, 'uint32'],
            },
            signatures: [
                {
                    pattern: '54 45 53 54 41 50 50 22',
                    rules: {},
                    addressOffset: 0
                }
            ],
        }
    ],

    testappFailNoPlayer: [
        {
            type: 'testapp',
            versions: "*",
            offsets: {
                test: [8, 'uint32'],
                zero: [12, 'uint32'],
            },
            signatures: [
                {
                    pattern: '<player>',
                    rules: {},
                    addressOffset: 0
                }
            ],
        }
    ]
}


module.exports = patterns;