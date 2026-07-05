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
  size: {
    type: Number,
    default: 64
  }
})

// Hashing function to consistently map any shoe name to one of the 20 sprite positions
const spriteIndex = computed(() => {
  if (!props.name) return 0
  let hash = 0
  for (let i = 0; i < props.name.length; i++) {
    hash = props.name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return Math.abs(hash) % 20 // 20 icons in the grid
})

const containerStyle = computed(() => {
  const index = spriteIndex.value
  const cols = 4 // 4 columns in the grid
  const col = index % cols
  const row = Math.floor(index / cols)

  // Divisors are (cols - 1) and (rows - 1)
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
