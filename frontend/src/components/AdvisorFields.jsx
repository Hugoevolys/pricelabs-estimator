// Informations du conseiller — alimentent le pied de page légal du PDF.
export default function AdvisorFields({ value, onChange }) {
  const set = (k) => (e) => onChange({ ...value, [k]: e.target.value });

  return (
    <div className="card form advisor">
      <h2>Informations du conseiller (pied de page du PDF)</h2>
      <p className="hint">
        Ces champs remplissent les mentions légales en bas du compte rendu PDF. Ils sont mémorisés sur cet appareil.
      </p>
      <div className="row">
        <label>
          Nom et prénom
          <input type="text" placeholder="ex : Jean Dupont"
            value={value.name} onChange={set("name")} />
        </label>
        <label>
          Ville du RSAC
          <input type="text" placeholder="ex : Dieppe"
            value={value.city} onChange={set("city")} />
        </label>
      </div>
      <div className="row">
        <label>
          N° RSAC
          <input type="text" placeholder="ex : 123 456 789"
            value={value.rsac} onChange={set("rsac")} />
        </label>
        <label>
          Adresse professionnelle
          <input type="text" placeholder="ex : 12 rue des Fleurs, 76200 Dieppe"
            value={value.address} onChange={set("address")} />
        </label>
      </div>
    </div>
  );
}
