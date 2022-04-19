const MAP_SIZE = 500
const NU_CENTER = ol.proj.fromLonLat([-87.6753, 42.056])

// downtown center, uncomment to use downtown instead, or make your own
// const NU_CENTER = ol.proj.fromLonLat([-87.6813, 42.049])
const AUTOMOVE_SPEED = 1
const UPDATE_RATE = 100
/*
 Apps are made out of a header (title/controls) and footer
 and some number of columns
 If its vertical, the columns can become sections in one column
 */


let landmarkCount = 0
let ptOffset = 1
let count = 3
const hashMap = new Map();
hashMap.set(1, "double points");
hashMap.set(2, "no points");
hashMap.set(3, "half points");
let gameState = {
	points: 3,
	captured: [],
	messages: [],
	specialEffect:[]
}

// Create an interactive map
// Change any of these functions

let map = new InteractiveMap({
	mapCenter: NU_CENTER,

	// Ranges
	ranges: [500, 200, 90, 1], // must be in reverse order

	initializeMap() {
		// A good place to load landmarks
		this.loadLandmarks("landmarks-shop-nu", (landmark) => {
			// Keep this landmark?

			// Keep all landmarks in the set
			return true

			// Only keep this landmark if its a store or amenity, e.g.
			// return landmark.properties.amenity || landmark.properties.store
		})

		// Create random landmarks
		// You can also use this to create trails or clusters for the user to find
		for (var i = 0; i < 20; i++) {
			// make a polar offset (radius, theta) 
			// from the map's center (units are *approximately* meters)
			let position = clonePolarOffset(NU_CENTER, 400*Math.random() + 300, 20*Math.random())
			this.createLandmark({
				pos: position,
				name: words.getRandomWord(),
			})
		}
	},

	update() {
		// Do something each frame
	},

	initializeLandmark: (landmark, isPlayer) => {
		// Add data to any landmark when it's created

		// Any openmap data?
		if (landmark.openMapData) {
			console.log(landmark.openMapData)
			landmark.name = landmark.openMapData.name
		}
		
		// *You* decide how to create a marker
		// These aren't used, but could be examples
		landmark.idNumber = landmarkCount++
		landmark.color = [Math.random(), 1, .5]

		// Give it a random number of points
		landmark.points = Math.floor(Math.random()*10 + 1)
		return landmark
	}, 

	onEnterRange: (landmark, newLevel, oldLevel, dist) => {
		// What happens when the user enters a range
		// -1 is not in any range

		console.log("enter", landmark.name, newLevel)
		if (newLevel == 2) {
			// 2 is the closest level. -1 is outside the range. 0 is the furthest level but it's within range. then it's 1, 2

			// Add points to my gamestate
			if(gameState.points >= landmark.points){
				let ptToAdd = landmark.points*(count>0?ptOffset:1)
				gameState.points += ptToAdd
				count--
				if(count==0){
					gameState.specialEffect=[]
				}
				// Have we captured this?
				if (!gameState.captured.includes(landmark.name)) {
					gameState.captured.push(landmark.name)

					// Add a message
					gameState.messages.push(`You captured ${landmark.name} for ${ptToAdd} points`)
					if(landmark.points == 10){
						let effect = hashMap.get(Math.floor(Math.random()*3)+1)
						ptOffset = effect==="double points" ? 2: effect === "no points" ? 0 : 0.5
						gameState.messages.push(`You activated ${effect}! It will be valid for the next 3 captures.`)
						count = 3
						gameState.specialEffect = []
						gameState.specialEffect.push(effect)
					}
				}else{
					gameState.messages.push(`You already captured ${landmark.name} before!`)
				}
			}else{
				gameState.messages.push(`You need ${landmark.points-gameState.points} more points to capture ${landmark.name}.`)
			}
		}
	},

	onExitRange: (landmark, newLevel, oldLevel, dist) => {
		// What happens when the user EXITS a range around a landmark 
		// e.g. (2->1, 0->-1)
		
		console.log("exit", landmark.name, newLevel)
	},
	
	
	featureToStyle: (landmark) => {
		// How should we draw this landmark?
		// Returns an object used to set up the drawing

		if (landmark.isPlayer) {
			return {
				icon: "face",
				noBG: true // skip the background
			}
		}
		
		// Pick out a hue, we can reuse it for foreground and background
		let hue = landmark.points*.1
		return {
			label: landmark.name + "\n" + landmark.distanceToPlayer +"m " + landmark.points + " pt",
			fontSize: 8,

			// Icons (in icon folder)
			icon: landmark.points==10?"priority_high":"pets",
		
			// Colors are in HSL (hue, saturation, lightness)
			iconColor: [hue, 1, .5],
			bgColor: [hue, 1, .2],
			noBG: true // skip the background
		}
	},
})


window.onload = (event) => {


	const app = new Vue({
		template: `
		<div id="app">
		<header></header>
			<div id="main-columns">

				<div class="main-column" style="flex:1;overflow:scroll;max-height:200px">

					{{gameState}}
					
				</div>

				<div class="main-column" style="overflow:hidden;width:${MAP_SIZE}px;height:${MAP_SIZE}px">
					<location-widget :map="map" />
				
				</div>

			</div>	
		<footer></footer>
		</div>`,

		data() {
			return {
			
				map: map,
				gameState: gameState
			}
		},

		// Get all of the intarsia components, plus various others
		components: Object.assign({
			// "user-widget": userWidget,
			// "room-widget": roomWidget,
			"location-widget": locationWidget,
		}),

		el: "#app"
	})

};

