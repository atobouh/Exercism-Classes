// Live figures that pages can embed with a ```figure block.
// Each figure returns its markup and a function that wires it up.
window.OCTET_FIGURES = {
  'trunk-tagging': {
    html: () => `<div class="figblock">
      <svg class="fg" viewBox="0 0 600 196" role="img" aria-label="PC-SALES and PC-ENG connect to switch S1, which has a trunk to router R1">
        <path class="lk" d="M140 42 C 190 42, 200 90, 236 96"/><path class="lk" d="M140 156 C 190 156, 200 108, 236 102"/>
        <path class="tk" d="M330 99 H 430"/><path class="tk2" d="M330 99 H 430"/>
        <g class="dv" transform="translate(16 20)"><rect width="124" height="44" rx="9"/><text class="nm" x="13" y="19">PC-SALES</text><text class="ad" x="13" y="34">VLAN 10</text></g>
        <g class="dv" transform="translate(16 134)"><rect width="124" height="44" rx="9"/><text class="nm" x="13" y="19">PC-ENG</text><text class="ad" x="13" y="34">VLAN 20</text></g>
        <g class="dv" transform="translate(236 77)"><rect width="94" height="44" rx="9"/><text class="nm" x="13" y="19">S1</text><text class="ad" x="13" y="34">Gi0/1</text></g>
        <g class="dv" transform="translate(430 77)"><rect width="150" height="44" rx="9"/><text class="nm" x="13" y="19">R1</text><text class="ad" x="13" y="34">G0/0/1.10, .20</text></g>
        <g class="frame" style="opacity:0"><rect x="-32" y="-10" width="64" height="20" rx="6"/><text x="0" y="4" text-anchor="middle">untagged</text></g>
      </svg>
      <div class="cap"><span>The frame from Sales gets its tag where it enters the trunk.</span><button class="btn line" type="button" data-send>Send a frame</button></div>
    </div>`,
    wire: (root, reduce) => {
      const frame = root.querySelector('.frame');
      root.querySelector('[data-send]').addEventListener('click', () => {
        const pts = [[140, 42], [236, 94], [330, 86], [430, 86]];
        const t = frame.querySelector('text'), r = frame.querySelector('rect');
        const label = (s, w) => { t.textContent = s; r.setAttribute('x', -w / 2); r.setAttribute('width', w); };
        if (reduce) { label('tag 10', 54); frame.setAttribute('transform', 'translate(430 74)'); frame.style.opacity = 1; return; }
        frame.style.transition = 'none'; label('untagged', 64); frame.setAttribute('transform', `translate(${pts[0][0]} ${pts[0][1] - 14})`); frame.style.opacity = 1;
        let i = 1;
        const step = () => {
          if (i >= pts.length) { setTimeout(() => { frame.style.opacity = 0; }, 1500); return; }
          frame.style.transition = ''; frame.setAttribute('transform', `translate(${pts[i][0]} ${pts[i][1] - 12})`);
          if (i === 2) label('tag 10', 54);
          i++; setTimeout(step, 760);
        };
        requestAnimationFrame(() => requestAnimationFrame(step));
      });
    },
  },
};
