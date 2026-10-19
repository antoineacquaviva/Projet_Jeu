import React from 'react';

export const Rules: React.FC = () => {
  return (
    <div className="regles">
      <h2>Le but</h2>
      <p>
        Une partie dure 4 tours. À chaque tour, les Machines du Méchant abattent des
        arbres et les joueurs, ensemble, en sauvent le plus possible. On compte à la fin
        les arbres restants. Il en tombe au moins un à chaque vague, et il en reste
        toujours.
      </p>

      <h2>La mise en place</h2>
      <ul>
        <li>
          <b>Chaque joueur pose sa tuile</b> contre le Cœur (3 × 3 cases, 3 arbres par
          case). Les tuiles forment une couronne : la rangée intérieure touche le Cœur, la
          rangée extérieure est la lisière, chaque tuile touche ses deux voisines.
        </li>
        <li>
          <b>Chaque joueur pose ses individus</b> (3) sur sa tuile. Ensuite, ils vont où
          ils veulent.
        </li>
        <li>
          <b>Les six Machines</b> sont rangées sur la piste des Machines. Il y en a une de
          plus que de joueurs sur le plateau (au plus six), posées dans l'ordre Grosse
          Gueule, Rapiat, Mâchoire, Tonton Débard, Ripaille, Zizanie : la Machine du
          joueur j sur la lisière de sa tuile, une de plus sur une lisière tirée au dé. Les
          autres attendent au chantier.
        </li>
      </ul>

      <h2>La tête du Méchant : deux pistes</h2>
      <p>
        Le Méchant ne dit pas ce qu'il va faire. Il lance deux dés, et ses deux pistes,
        publiques, disent ce que chaque lancer donnera. La position d'une tuile sur une
        piste est sa probabilité.
      </p>
      <ul>
        <li>
          <b>La piste des pensées</b>, cases 2 à 12 : la <b>somme</b> des dés désigne une
          case, et la tuile qui s'y trouve donne la tactique. Le 7 sort 6 fois sur 36, le 2
          et le 12 une fois.
        </li>
        <li>
          <b>La piste des Machines</b>, six cases imprimées dans l'ordre des probabilités :
          l'<b>écart</b> des dés désigne la Machine qui obéit. Écart 1 : 10 chances sur 36 ;
          écart 2 : 8 ; écart 0 (un double) : 6 ; écart 3 : 6 ; écart 4 : 4 ; écart 5 : 2.
        </li>
        <li>
          Somme et écart viennent des mêmes dés : une Machine ne reçoit pas toutes les
          tactiques. La Machine de l'écart 5 joue toujours la case 7, celle de l'écart 4 les
          cases 6 ou 8, celle de l'écart 1 les cases impaires de 3 à 11, le double les
          cases paires. La barre colorée sous chaque Machine le montre.
        </li>
      </ul>

      <h3>Un lancer</h3>
      <ul>
        <li>
          La Machine désignée applique la tactique dans son rayon (sa case et les cases
          voisines qui ont encore des arbres), sur la forêt du moment. Si sa cible est
          gardée, la menace est parée et la Machine reste. Sinon elle y entre et abat un
          arbre.
        </li>
        <li>
          Si la Machine désignée est au chantier, elle entre sur une case de lisière tirée
          au dé et y abat un arbre (ou, sans arbre là, sur la case boisée la plus proche).
          Une garde sur cette case la pare.
        </li>
        <li>
          <b>Il apprend</b>, après chaque lancer : la tuile de tactique et la Machine
          désignées s'échangent avec une voisine. Si un arbre est tombé (réussite), la
          tactique va vers le 7 et la Machine vers le côté probable. Si la menace a été
          parée (échec), la tactique va vers le bord (au 7, vers le 8) et la Machine vers
          le côté rare. Au bord, rien ne bouge.
        </li>
      </ul>

      <h2>Un tour</h2>
      <ol>
        <li>
          <b>Les cartes.</b> Chaque joueur pose deux cartes d'ordre, numérotées 1 et 2,
          chacune pour l'un de ses individus (le même peut recevoir les deux), en même
          temps que les autres.
        </li>
        <li>
          <b>Étape 1.</b> On révèle les cartes 1 : déplacements d'abord, puis gardes et
          sabotages posés.
        </li>
        <li>
          <b>Vague 1.</b> Le Méchant lance les dés autant de fois qu'il y a de joueurs, plus
          une.
        </li>
        <li>
          <b>Étape 2.</b> Les gardes et sabotages de l'étape 1 tombent ; on révèle les
          cartes 2.
        </li>
        <li>
          <b>Vague 2.</b> Autant de lancers.
        </li>
      </ol>

      <h3>Les ordres</h3>
      <ul>
        <li>
          <b>Garder</b> : l'individu garde sa case. La première menace qui la vise pendant
          la vague est parée.
        </li>
        <li>
          <b>Aller</b> : l'individu va sur une case voisine. Il ne pare rien, mais sa
          présence compte aussitôt pour les tactiques.
        </li>
        <li>
          <b>Saboter</b> : l'individu est sur la case d'une Machine. La première menace de
          cette Machine pendant la vague est parée ; la Machine va quand même où elle
          voulait, sans abattre.
        </li>
        <li>
          <b>Un ordre devenu impossible est perdu</b> : saboter une Machine qui a quitté
          la case pendant la vague 1, par exemple.
        </li>
      </ul>

      <h3>Les tactiques</h3>
      <table>
        <thead>
          <tr>
            <th>Tactique</th>
            <th>Case visée dans le rayon</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <span className="tac cupidite">Cupidité</span>
            </td>
            <td>la plus boisée</td>
          </tr>
          <tr>
            <td>
              <span className="tac percee">Percée</span>
            </td>
            <td>la plus proche du Cœur</td>
          </tr>
          <tr>
            <td>
              <span className="tac opportunisme">Opportunisme</span>
            </td>
            <td>la moins défendue (le moins d'individus)</td>
          </tr>
          <tr>
            <td>
              <span className="tac represailles">Représailles</span>
            </td>
            <td>la plus défendue</td>
          </tr>
        </tbody>
      </table>
      <p className="small">
        Égalités : la plus boisée, puis la plus proche du Cœur, puis la case de la Machine,
        puis le plus petit numéro. Sans arbre dans son rayon, une Machine va vers la case
        boisée la plus proche.
      </p>

      <h2>Les réglages</h2>
      <p>
        Cartes par joueur (deux, ou une seule comme témoin, sur 8 tours), lancers par vague
        (un ou deux de plus que de joueurs), rythme de l'apprentissage (après chaque
        lancer, ou à la fin de chaque vague), présage (les dés de la vague 1 montrés avant
        les cartes), taille des tuiles, individus, arbres, tours.
      </p>
    </div>
  );
};
