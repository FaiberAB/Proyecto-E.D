const Sim = (() => {

  const LIMITE_SEGURO = 0.02;

  function simulate({ v0, a0, rin, rout, l, tEval, dt = 1 }) {
    const deltaR = rin - rout;               
    const diasTotales = Math.max(tEval, 50); 

    const labels = [];
    const dataConcentracion = [];
    const dataLimite = [];

    let A = a0;
    let objetivo = { A: 0, V: 0, C: 0 };

    for (let t = 0; t <= diasTotales; t += dt) {
      let V = v0 + deltaR * t;
      if (V <= 0) V = 0.0001; 

      const concentracion = A / V;

      labels.push(t);
      dataConcentracion.push(concentracion);
      dataLimite.push(LIMITE_SEGURO);

      if (t === tEval) {
        objetivo = { A, V, C: concentracion };
      }

      const dA_dt = l - rout * concentracion;
      A = A + dA_dt * dt;
    }

    return {
      labels,
      dataConcentracion,
      dataLimite,
      deltaR,
      tEval,
      A_objetivo: objetivo.A,
      V_objetivo: objetivo.V,
      C_objetivo: objetivo.C,
    };
  }

  return { LIMITE_SEGURO, simulate };
})();
