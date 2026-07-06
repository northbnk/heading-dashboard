<template>
  <div
    class="shoe-sprite-container"
    :style="containerStyle"
  ></div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  name: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    default: ''
  },
  size: {
    type: Number,
    default: 64
  }
})

const popularModelsMap = {
  // Racing
  'alphafly': { col: 0, row: 0 },
  'vaporfly': { col: 1, row: 0 },
  'adios pro': { col: 2, row: 0 },
  'metaspeed': { col: 3, row: 0 },
  // Trainers
  'pegasus': { col: 0, row: 1 },
  'boston': { col: 1, row: 1 },
  'novablast': { col: 2, row: 2 },
  'endorphin': { col: 3, row: 2 },
  // Cushion
  'clifton': { col: 0, row: 3 },
  'bondi': { col: 1, row: 3 },
  'cloudmonster': { col: 2, row: 3 },
  'deviate nitro': { col: 3, row: 3 },
  'velocity nitro': { col: 3, row: 3 },
  'nimbus': { col: 2, row: 4 },
  'invincible': { col: 3, row: 4 },
  // Trail
  'speedgoat': { col: 0, row: 5 },
  'salomon': { col: 1, row: 6 },
  'sense ride': { col: 1, row: 6 },
  'trabuco': { col: 2, row: 6 },
  'wildhorse': { col: 3, row: 6 },
  'lone peak': { col: 4, row: 6 },
  'timp': { col: 4, row: 6 }
}

const containerStyle = computed(() => {
  let col = 0
  let row = 0

  if (props.name) {
    let hash = 0
    for (let i = 0; i < props.name.length; i++) {
      hash = props.name.charCodeAt(i) + ((hash << 5) - hash)
    }
    const safeHash = Math.abs(hash)
    const nameLower = props.name.toLowerCase()

    // 1. Check direct matches for iconic real shoe models
    let matchedKey = null
    for (const key in popularModelsMap) {
      if (nameLower.includes(key)) {
        matchedKey = key
        break
      }
    }

    if (matchedKey) {
      col = popularModelsMap[matchedKey].col
      row = popularModelsMap[matchedKey].row
    } else {
      // 2. Map other shoes to a matching category coordinate
      let cat = props.category
      if (!cat) {
        if (nameLower.includes('vapor') || nameLower.includes('alpha') || nameLower.includes('metaspeed') || nameLower.includes('adizero') || nameLower.includes('pro')) {
          cat = 'racing'
        } else if (nameLower.includes('trail') || nameLower.includes('speedgoat') || nameLower.includes('wildhorse') || nameLower.includes('trabuco')) {
          cat = 'trail'
        } else if (nameLower.includes('bondi') || nameLower.includes('invincible') || nameLower.includes('kayano') || nameLower.includes('nimbus') || nameLower.includes('cushion')) {
          cat = 'cushion'
        } else {
          cat = 'daily'
        }
      }

      cat = cat.toLowerCase()
      if (cat === 'racing') {
        const racingCoords = [
          { col: 0, row: 0 }, // Alphafly
          { col: 1, row: 0 }, // Vaporfly
          { col: 2, row: 0 }, // Adizero Pro
          { col: 3, row: 0 }  // Metaspeed
        ]
        const coord = racingCoords[safeHash % racingCoords.length]
        col = coord.col
        row = coord.row
      } else if (cat === 'daily') {
        const dailyCoords = [
          { col: 0, row: 1 }, // Pegasus
          { col: 1, row: 1 }, // Boston
          { col: 2, row: 2 }, // Novablast
          { col: 3, row: 2 }  // Endorphin Speed
        ]
        const coord = dailyCoords[safeHash % dailyCoords.length]
        col = coord.col
        row = coord.row
      } else if (cat === 'cushion') {
        const cushionCoords = [
          { col: 0, row: 3 }, // Clifton
          { col: 1, row: 3 }, // Bondi
          { col: 2, row: 3 }, // Cloudmonster
          { col: 3, row: 3 }, // Deviate Nitro
          { col: 2, row: 4 }, // Nimbus
          { col: 3, row: 4 }  // Invincible
        ]
        const coord = cushionCoords[safeHash % cushionCoords.length]
        col = coord.col
        row = coord.row
      } else if (cat === 'trail') {
        const trailCoords = [
          { col: 0, row: 5 }, // Speedgoat
          { col: 1, row: 6 }, // Salomon
          { col: 2, row: 6 }, // Trabuco
          { col: 3, row: 6 }, // Wildhorse
          { col: 4, row: 6 }  // Lone Peak
        ]
        const coord = trailCoords[safeHash % trailCoords.length]
        col = coord.col
        row = coord.row
      } else {
        col = safeHash % 5
        row = safeHash % 7
      }
    }
  }

  // Divisors for 5 columns and 7 rows
  const posX = col * (100 / 4)   // 5 columns -> indices 0-4 -> 4 steps
  const posY = row * (100 / 6)   // 7 rows -> indices 0-6 -> 6 steps

  return {
    width: `${props.size}px`,
    height: `${props.size}px`,
    backgroundImage: 'url("/real_shoes_sprite_right.jpg")',
    backgroundSize: '500% 700%', // 5 columns, 7 rows
    backgroundPosition: `${posX}% ${posY}%`,
    backgroundRepeat: 'no-repeat',
    borderRadius: '12px',
    backgroundColor: '#ffffff',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
  }
})
</script>

<style scoped>
.shoe-sprite-container {
  display: inline-block;
  transition: transform 0.2s ease;
}
.shoe-sprite-container:hover {
  transform: scale(1.05);
}
</style>
