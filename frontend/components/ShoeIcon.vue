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

const containerStyle = computed(() => {
  let col = 0
  let row = 0

  if (props.name) {
    let hash = 0
    for (let i = 0; i < props.name.length; i++) {
      hash = props.name.charCodeAt(i) + ((hash << 5) - hash)
    }
    col = Math.abs(hash) % 4 // 4 columns (0 to 3)

    if (props.category) {
      const cat = props.category.toLowerCase()
      if (cat === 'racing') row = 0
      else if (cat === 'daily') row = 1
      else if (cat === 'cushion') row = 2
      else if (cat === 'trail') row = 3
      else row = Math.abs(hash) % 5
    } else {
      // Infer category from shoe name heuristics
      const nameLower = props.name.toLowerCase()
      if (nameLower.includes('vapor') || nameLower.includes('alpha') || nameLower.includes('metaspeed') || nameLower.includes('adizero') || nameLower.includes('pro')) {
        row = 0 // Racing
      } else if (nameLower.includes('pegasus') || nameLower.includes('ghost') || nameLower.includes('clifton') || nameLower.includes('rider')) {
        row = 1 // Daily
      } else if (nameLower.includes('bondi') || nameLower.includes('invincible') || nameLower.includes('kayano') || nameLower.includes('nimbus')) {
        row = 2 // Cushion
      } else if (nameLower.includes('trail') || nameLower.includes('speedgoat') || nameLower.includes('wildhorse') || nameLower.includes('trabuco')) {
        row = 3 // Trail
      } else {
        row = Math.abs(hash) % 5
      }
    }
  }

  const posX = col * (100 / 3) // 4 columns, indices 0-3 -> 3 steps
  const posY = row * (100 / 4) // 5 rows, indices 0-4 -> 4 steps

  return {
    width: `${props.size}px`,
    height: `${props.size}px`,
    backgroundImage: 'url("/shoes_sprite.jpg")',
    backgroundSize: '400% 500%', // 4 columns, 5 rows (20 shoes total)
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
