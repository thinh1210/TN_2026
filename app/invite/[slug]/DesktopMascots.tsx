'use client'

import Image from 'next/image'

const BOTTOM_PATROL = [
  {
    id: 'pikachu',
    src: '/pokemon/pikachu.gif',
    className: 'mascot mascot-bottom-1',
    width: 84,
    height: 78,
  },
  {
    id: 'eevee',
    src: '/pokemon/eevee.gif',
    className: 'mascot mascot-bottom-2',
    width: 78,
    height: 78,
  },
  {
    id: 'bulbasaur',
    src: '/pokemon/bulbasaur.gif',
    className: 'mascot mascot-bottom-3',
    width: 72,
    height: 72,
  },
  {
    id: 'charmander',
    src: '/pokemon/charmander.gif',
    className: 'mascot mascot-bottom-4',
    width: 75,
    height: 75,
  },
  {
    id: 'squirtle',
    src: '/pokemon/squirtle.gif',
    className: 'mascot mascot-bottom-5',
    width: 72,
    height: 75,
  },
]

const ROAMING_SIDE = [
  {
    id: 'jigglypuff',
    src: '/pokemon/jigglypuff.gif',
    className: 'mascot mascot-left-top',
    width: 78,
    height: 78,
  },
  {
    id: 'psyduck',
    src: '/pokemon/psyduck.gif',
    className: 'mascot mascot-left-low',
    width: 75,
    height: 84,
  },
  {
    id: 'mew',
    src: '/pokemon/mew.gif',
    className: 'mascot mascot-right-top',
    width: 108,
    height: 78,
  },
]

export default function DesktopMascots() {
  return (
    <div className="desktop-mascots" aria-hidden="true">
      {BOTTOM_PATROL.map((p) => (
        <Image
          key={p.id}
          src={p.src}
          alt=""
          width={p.width}
          height={p.height}
          unoptimized
          className={p.className}
        />
      ))}
      {ROAMING_SIDE.map((p) => (
        <Image
          key={p.id}
          src={p.src}
          alt=""
          width={p.width}
          height={p.height}
          unoptimized
          className={p.className}
        />
      ))}
    </div>
  )
}
