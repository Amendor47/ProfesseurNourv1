/* ============================================================
   WHEN YOU CALL ME, SINGE — character designs
   Lou (Loupiote) and Elias rendered as crisp pixel-art SVG
   busts with a real expression system. Scalable, editable,
   on-brand with the lo-fi/CRT look.

   LOU   — Maghrebi-French streamer. Warm brown skin, long brown
           hair, gold hoop, amber headphones, burnt-orange hoodie.
           Expressive + quick to anger.
   ELIAS — tall Swede. Pale, blond side-swept hair, nordic-blue
           jacket. Calm to the point of blank; rare soft smile.
   ============================================================ */
window.Characters = (function(){
  const U = 5; // px per pixel-unit

  /* ---- LOU palette ---- */
  const L = {
    skin:'#c5895b', skinD:'#a96d44', skinL:'#d7a075',
    hair:'#46291a', hairD:'#341d0f', hairHi:'#5e3a22',
    hood:'#d8693b', hoodD:'#b1502a',
    band:'#272030', amber:'#f2c14e',
    eyeW:'#f6eeda', iris:'#3f2614', brow:'#341d0f',
    mouth:'#9c4040', teeth:'#f6eeda', tear:'#a7c8ea', blush:'#e0875c'
  };
  /* ---- ELIAS palette ---- */
  const E = {
    skin:'#e6c6a2', skinD:'#cda87f', skinL:'#f1d9bc',
    hair:'#cdab63', hairD:'#ad8c48', hairHi:'#e8d088',
    jack:'#6e93bd', jackD:'#506f97', shirt:'#cdd6dd',
    eyeW:'#f6eeda', iris:'#3f5d80', brow:'#ad8c48',
    mouth:'#b27c6c', tear:'#a7c8ea', blush:'#cf9b86'
  };

  /* ============ LOU ============ */
  function lou(expr){
    const P=[]; const a=(x,y,w,h,c)=>P.push([x,y,w,h,c]);
    // back hair + long falls
    a(5,4,16,23,L.hairD);
    a(4,16,3,12,L.hairD); a(19,16,3,12,L.hairD);
    // hair crown
    a(6,3,14,15,L.hair); a(6,3,14,2,L.hairHi);
    // face
    a(8,6,10,13,L.skin); a(8,6,10,1,L.skinL); a(8,16,10,2,L.skinD);
    // bangs + centre part
    a(8,5,10,3,L.hair); a(11,5,1,4,L.hairD); a(14,5,1,3,L.hairD);
    // ears
    a(7,11,1,3,L.skin); a(18,11,1,3,L.skin);
    // gold hoop earring
    a(7,14,1,2,L.amber); a(7,15,2,1,L.amber);
    // headphones
    a(6,2,14,1,L.band);
    a(5,9,3,6,L.band); a(5,10,2,4,L.amber);
    a(18,9,3,6,L.band); a(19,10,2,4,L.amber);
    // neck
    a(11,17,4,2,L.skinD);
    // hoodie + collar + front locks
    a(5,19,16,11,L.hood); a(5,19,16,1,L.hoodD);
    a(10,19,6,2,L.hoodD); a(5,27,16,3,L.hoodD);
    a(4,18,3,11,L.hair); a(19,18,3,11,L.hair);

    // ---- expression: brows / eyes / mouth / extras ----
    const lx=10, rx=14, ey=11;
    const white=()=>{ a(lx,ey,2,2,L.eyeW); a(rx,ey,2,2,L.eyeW); };
    const pupils=(dx,dy)=>{ a(lx+dx,ey+dy,1,1,L.iris); a(rx+1-dx,ey+dy,1,1,L.iris); };
    const flatBrow=(y)=>{ a(lx,y,2,1,L.brow); a(rx,y,2,1,L.brow); };

    switch(expr){
      case 'angry':
        // brows slam down toward centre
        a(lx,9,1,1,L.brow); a(lx+1,10,1,1,L.brow);
        a(rx+1,9,1,1,L.brow); a(rx,10,1,1,L.brow);
        white(); pupils(0,1);
        // gritted shout
        a(11,16,4,2,L.mouth); a(11,16,4,1,L.teeth);
        // flushed cheeks + anger mark
        a(8,14,1,1,L.blush); a(17,14,1,1,L.blush);
        a(18,6,2,1,'#e0533a'); a(19,5,1,1,'#e0533a');
        break;
      case 'laugh':
        // happy closed eyes (^ ^)
        a(10,12,1,1,L.brow); a(11,11,1,1,L.brow);
        a(14,11,1,1,L.brow); a(15,12,1,1,L.brow);
        flatBrow(9);
        // big open grin
        a(11,16,4,2,L.mouth); a(11,16,4,1,L.teeth); a(10,16,1,1,L.mouth); a(15,16,1,1,L.mouth);
        a(8,14,1,1,L.blush); a(17,14,1,1,L.blush);
        break;
      case 'cry':
        // brows up-inner (sad)
        a(lx,10,1,1,L.brow); a(lx+1,9,1,1,L.brow);
        a(rx+1,10,1,1,L.brow); a(rx,9,1,1,L.brow);
        white(); pupils(0,1);
        // tears
        a(10,13,1,3,L.tear); a(15,13,1,3,L.tear); a(10,16,1,1,L.tear);
        // wobbly frown
        a(11,17,4,1,L.mouth); a(11,16,1,1,L.mouth); a(14,16,1,1,L.mouth);
        break;
      case 'sleep':
        // closed, peaceful
        a(10,12,2,1,L.brow); a(14,12,2,1,L.brow);
        a(13,17,2,1,L.mouth); // tiny mouth
        a(20,7,1,1,L.eyeW); a(21,6,1,1,L.eyeW); // little 'z'
        a(22,5,2,1,L.eyeW);
        break;
      case 'soft':
        flatBrow(9);
        a(lx,ey,2,2,L.eyeW); a(rx,ey,2,2,L.eyeW);
        a(lx+1,ey+1,1,1,L.iris); a(rx,ey+1,1,1,L.iris); // gaze down-centre
        a(11,16,3,1,L.mouth); a(13,17,1,1,L.mouth); // gentle smile
        a(8,14,1,1,L.blush); a(17,14,1,1,L.blush);
        break;
      case 'surprise':
        a(lx,8,2,1,L.brow); a(rx,8,2,1,L.brow); // raised
        a(lx,10,2,3,L.eyeW); a(rx,10,2,3,L.eyeW); // wide
        a(lx,11,1,1,L.iris); a(rx+1,11,1,1,L.iris);
        a(12,16,2,2,L.mouth); // open 'o'
        break;
      default: // neutral
        flatBrow(9); white(); pupils(1,1);
        a(12,16,2,1,L.mouth);
    }
    return P;
  }

  /* ============ ELIAS ============ */
  function elias(expr){
    const P=[]; const a=(x,y,w,h,c)=>P.push([x,y,w,h,c]);
    // side-swept blond hair
    a(7,2,12,7,E.hair); a(7,2,12,2,E.hairHi);
    a(6,3,4,6,E.hairD); a(17,3,3,4,E.hair);
    a(8,2,8,1,E.hairHi);
    // face (longer, set a touch lower)
    a(8,7,10,13,E.skin); a(8,7,10,1,E.skinL); a(8,18,10,2,E.skinD);
    a(8,6,10,2,E.hair); // hairline
    // ears
    a(7,12,1,3,E.skin); a(18,12,1,3,E.skin);
    // neck (long) + jacket
    a(11,20,4,3,E.skinD);
    a(4,22,18,8,E.jack); a(4,22,18,1,E.jackD);
    a(9,22,2,3,E.shirt); a(11,22,3,2,E.shirt); // collar + tee
    a(12,24,2,6,E.jackD); // zip
    a(7,23,3,3,E.jackD); a(16,23,3,3,E.jackD); // lapels

    const lx=10, rx=14, ey=13;
    const white=()=>{ a(lx,ey,2,2,E.eyeW); a(rx,ey,2,2,E.eyeW); };
    const flatBrow=(y)=>{ a(lx,y,2,1,E.brow); a(rx,y,2,1,E.brow); };

    switch(expr){
      case 'soft':
        flatBrow(11);
        white(); a(lx+1,ey+1,1,1,E.iris); a(rx,ey+1,1,1,E.iris);
        a(11,18,3,1,E.mouth); a(13,19,1,1,E.mouth); // faint smile
        break;
      case 'warm':
        flatBrow(11);
        white(); a(lx+1,ey+1,1,1,E.iris); a(rx,ey+1,1,1,E.iris);
        a(11,18,4,1,E.mouth); a(10,18,1,1,E.mouth); a(15,18,1,1,E.mouth);
        a(8,16,1,1,E.blush); a(17,16,1,1,E.blush); // rare blush
        break;
      case 'surprise': // the snort-laugh
        a(lx,9,2,1,E.brow); a(rx,9,2,1,E.brow);
        a(lx,11,2,3,E.eyeW); a(rx,11,2,3,E.eyeW);
        a(lx,12,1,1,E.iris); a(rx+1,12,1,1,E.iris);
        a(12,18,3,2,E.mouth); a(12,18,3,1,'#f6eeda');
        a(19,9,1,1,E.skinL); a(20,8,1,1,E.skinL); // little puff
        break;
      case 'away': // looking aside, guarded
        flatBrow(11);
        white(); a(lx,ey+1,1,1,E.iris); a(rx,ey+1,1,1,E.iris); // both left
        a(11,18,3,1,E.mouth);
        break;
      case 'sad':
        a(lx,12,1,1,E.brow); a(lx+1,11,1,1,E.brow);
        a(rx+1,12,1,1,E.brow); a(rx,11,1,1,E.brow);
        white(); a(lx+1,ey+1,1,1,E.iris); a(rx,ey+1,1,1,E.iris);
        a(11,19,4,1,E.mouth); a(11,18,1,1,E.mouth); a(14,18,1,1,E.mouth);
        break;
      default: // neutral — calm, almost blank
        flatBrow(11);
        white(); a(lx+1,ey+1,1,1,E.iris); a(rx,ey+1,1,1,E.iris);
        a(12,18,3,1,E.mouth);
    }
    return P;
  }

  /* ---- compose to SVG ---- */
  function rects(P, ox){
    let s='';
    for(const [x,y,w,h,c] of P){
      s+=`<rect x="${(x+ox)*U}" y="${y*U}" width="${w*U}" height="${h*U}" fill="${c}"/>`;
    }
    return s;
  }
  function wrap(inner, vbW){
    return `<svg viewBox="0 0 ${vbW} 152" xmlns="http://www.w3.org/2000/svg" `+
      `shape-rendering="crispEdges" style="width:100%;height:auto;display:block">`+
      // soft floor shadow
      `<ellipse cx="${vbW/2}" cy="148" rx="${vbW*0.34}" ry="6" fill="rgba(0,0,0,.45)"/>`+
      inner+`</svg>`;
  }
  function pix(who, expr){ return who==='elias'? elias(expr) : lou(expr); }

  return {
    svg(who, expr){ return wrap(rects(pix(who,expr||'neutral'),0), 130); },
    two(lExpr, eExpr){
      return wrap(rects(lou(lExpr||'neutral'),0)+rects(elias(eExpr||'neutral'),24), 250);
    }
  };
})();
