export default (id, root = document.getElementById('game')) => {
  const canvas = document.createElement('canvas');
  root.appendChild(canvas);
  if (id) canvas.id = id;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'white';

  return ctx;
};
