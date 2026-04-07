//objects.js
export const OBJECT_DEFINITIONS = [
    {
        name:  "Police Car",
        type:  "vehicle",
        model: "car_police.glb",
        mapX:  50, // Assuming GRID_SIZE is 100, this places it at the map's center X
        mapY:  50, // Assuming GRID_SIZE is 100, this places it at the map's center Y
        rotationY: Math.PI,
        scale: 0.7  
    },

        {
        name:  "Ambulance",
        type:  "vehicle",
        model: "car_ambulance.glb",
        mapX:  36, // Assuming GRID_SIZE is 100, this places it at the map's center X
        mapY:  48, // Assuming GRID_SIZE is 100, this places it at the map's center Y
        mapZ:  0.60, 
        rotationY: Math.PI/2,
        scale: 2.5  
    },
        {
        name:  "SIMONS' House",
        type:  "building",
        model: "building_house1.glb",
        mapX:  35, // Assuming GRID_SIZE is 100, this places it at the map's center X
        mapY:  50, // Assuming GRID_SIZE is 100, this places it at the map's center Y
        rotationY: Math.PI,
        scale: 5   
    },

    {
        name:  "The two guys",
        type:  "character",
        model: "character_man1.glb",
        mapX:  32,
        mapY:  46,
        mapZ:  1.6,   // lift off ground slightly
        rotationY: Math.PI,
        scale: 0.5  
    },

    {
        name:  "sesamestreet1",
        type:  "transport",
        model: "transport_street_straight.glb",
        mapXFrom: 35,   // start X
        mapXTo:   40,   // end X
        mapY:     48,
        mapZ:     0.005,
        rotationY: Math.PI / 2,
        scale: 0.5
    },


];