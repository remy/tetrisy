export default (id) => {
  const canvas = document.createElement('canvas');
  document.getElementById('game').appendChild(canvas);
  if (id) canvas.id = id;
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = 'white';
  
  return ctx;
}