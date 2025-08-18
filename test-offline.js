// test-offline.js (à exécuter après avoir chargé script.clean.js dans une page de test)
(function(){
  const sample = `
Photosynthèse et respiration
La photosynthèse est un processus qui convertit l'énergie lumineuse en énergie chimique...
Par exemple, chez les plantes, elle entraîne la production de glucose...
Cependant, une limite tient à l'intensité lumineuse...
En pratique, cela implique des variations selon l'environnement...
`;
  runUnifiedPipeline(sample, 'offline', ()=>{});
  console.assert(CM.sections.length>0, 'sections');
  console.assert(CM.sections[0].summary.long.split(/(?<=[.!?])\s+/).length >= 22 || CM.sections.length===1, 'fiche long length');
  console.assert(CM.qa.qcm.length>0, 'qcm exists');
  console.assert(CM.qa.qcm.every(q=> new Set(q.options.map(o=>o.toLowerCase())).size===4 ), 'qcm unique options');
  console.assert(CM.qa.flashcards.length>0, 'flashcards exists');
  console.assert(new Set(CM.qa.flashcards.map(c=>c.type)).size>=3, 'flashcard types >=3');
  console.log('Offline++ smoke tests OK');
})();

