import {
  IconAlien,
  IconCactus,
  IconCat,
  IconCrown,
  IconDiamond,
  IconDog,
  IconFlame,
  IconGhost,
  IconMoon,
  IconPizza,
  IconPlant,
  IconRobot,
  IconRocket,
  IconSkull,
  IconSword,
  IconUfo,
} from '@tabler/icons-vue'
import type { Component } from 'vue'

export const AVATAR_ICONS: Record<string, Component> = {
  ghost: IconGhost,
  alien: IconAlien,
  cat: IconCat,
  skull: IconSkull,
  pizza: IconPizza,
  rocket: IconRocket,
  plant: IconPlant,
  flame: IconFlame,
  robot: IconRobot,
  dog: IconDog,
  ufo: IconUfo,
  cactus: IconCactus,
  diamond: IconDiamond,
  moon: IconMoon,
  sword: IconSword,
  crown: IconCrown,
}

export const AVATAR_COLORS: Record<string, { bg: string; fg: string; solid: string }> = {
  purple: { bg: '#EEEDFE', fg: '#3C3489', solid: '#7F77DD' },
  teal: { bg: '#E1F5EE', fg: '#085041', solid: '#1D9E75' },
  coral: { bg: '#FAECE7', fg: '#712B13', solid: '#D85A30' },
  pink: { bg: '#FBEAF0', fg: '#72243E', solid: '#D4537E' },
  amber: { bg: '#FAEEDA', fg: '#633806', solid: '#EF9F27' },
  blue: { bg: '#E6F1FB', fg: '#0C447C', solid: '#378ADD' },
  green: { bg: '#EAF3DE', fg: '#27500A', solid: '#639922' },
  red: { bg: '#FCEBEB', fg: '#791F1F', solid: '#E24B4A' },
  gray: { bg: '#F1EFE8', fg: '#444441', solid: '#888780' },
}

export const TEAM_COLORS = ['coral', 'blue', 'teal', 'purple', 'amber', 'pink', 'green', 'red']

export const TEAM_NAMES: Record<string, string> = {
  coral: 'Les Rouges',
  blue: 'Les Bleus',
  teal: 'Les Verts',
  purple: 'Les Violets',
  amber: 'Les Jaunes',
  pink: 'Les Roses',
  green: 'Les Kakis',
  red: 'Les Écarlates',
}

export function parseAvatar(avatar: string | undefined | null) {
  const [icon = 'ghost', color = 'purple'] = (avatar ?? '').split(':')
  return {
    icon: AVATAR_ICONS[icon] ? icon : 'ghost',
    color: AVATAR_COLORS[color] ? color : 'purple',
  }
}

export function formatAvatar(icon: string, color: string) {
  return `${icon}:${color}`
}

export function randomAvatar() {
  const icons = Object.keys(AVATAR_ICONS)
  const colors = Object.keys(AVATAR_COLORS)
  return formatAvatar(
    icons[Math.floor(Math.random() * icons.length)]!,
    colors[Math.floor(Math.random() * colors.length)]!,
  )
}

export function teamColor(color: string) {
  return AVATAR_COLORS[color] ?? AVATAR_COLORS.coral!
}
