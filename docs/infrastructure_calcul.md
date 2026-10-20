# Infrastructure de calcul : Machine Virtuelle Oracle Cloud (OCI)

Ce document consigne les informations techniques, les commandes d'accès et les procédures d'exécution pour la machine virtuelle OCI dédiée aux campagnes de simulation intensives de *La Forêt qui rêve*.

---

## 1. Fiche technique de la VM

| Paramètre | Valeur |
|---|---|
| **Fournisseur** | Oracle Cloud Infrastructure (OCI) |
| **Tenancy / Compartiment** | `antoineacquaviva (racine)` |
| **Nom de l'instance** | `vm-campagne-tests` (ou équivalent) |
| **Adresse IP publique** | `141.145.218.127` |
| **Utilisateurs SSH** | `opc` (Oracle Linux) ou `ubuntu` (Ubuntu) |
| **Chemin local de la clé SSH** | `C:\Users\antoi\Documents\Projet Jeu\ssh-key-2026-10-18.key` |
| **Port SSH** | `22` |
| **Réseau virtuel (VCN)** | `VCN-Tests-Jeu` (sous-réseau public) |
| **Ressources** | Instance Flex calcul haute performance (CPU multi-cœurs, mémoire dédiée) |
| **Disque d'initialisation (Boot)** | 50 à 100 Go |

---

## 2. Connexion SSH depuis la machine locale

Depuis un terminal PowerShell sous Windows :

```powershell
# Connexion avec l'utilisateur opc (Oracle Linux par défaut) :
ssh -i "C:\Users\antoi\Documents\Projet Jeu\ssh-key-2026-10-18.key" opc@141.145.218.127

# Ou avec l'utilisateur ubuntu (si image Ubuntu) :
ssh -i "C:\Users\antoi\Documents\Projet Jeu\ssh-key-2026-10-18.key" ubuntu@141.145.218.127
```

> [!NOTE]
> En cas d'erreur `UNPROTECTED PRIVATE KEY FILE` ou de permissions refusées sous Windows, restreindre l'accès à la clé :
> ```powershell
> icacls "C:\Users\antoi\Documents\Projet Jeu\ssh-key-2026-10-18.key" /inheritance:r
> icacls "C:\Users\antoi\Documents\Projet Jeu\ssh-key-2026-10-18.key" /grant:r "$($env:USERNAME):(R)"
> ```

---

## 3. Configuration initiale de la VM (à exécuter une fois)

```bash
# Mise à jour et outils nécessaires
sudo apt-get update && sudo apt-get install -y python3 python3-pip python3-venv git htop tmux
# (ou sous Oracle Linux / RedHat) :
# sudo dnf install -y python3 python3-pip git htop tmux

# Cloner le projet
git clone https://github.com/antoineacquaviva/Projet_Jeu.git
cd Projet_Jeu

# Environnement virtuel Python
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip pytest
```

---

## 4. Lancer une campagne intensive en arrière-plan (`tmux`)

L'outil `tmux` permet de maintenir l'exécution des campagnes même si la connexion SSH locale est coupée ou le PC éteint.

```bash
# 1. Ouvrir une session de calcul
tmux new -s calcul

# 2. Se placer dans le projet et activer l'environnement
cd ~/Projet_Jeu
git pull
source venv/bin/activate

# 3. Lancer une campagne en exploitant 100 % des cœurs CPU disponibles
python3 -m placement.campagne campagnes/pistes_campagne3.json --sortie res_vm/ --processus $(nproc)
```

### Commandes utiles pour `tmux` :
- **Détacher la session (laisser tourner en tâche de fond)** : appuyer sur `Ctrl + B`, relâcher, puis taper `D`.
- **Reprendre la session plus tard** :
  ```bash
  tmux attach -t calcul
  ```
- **Surveiller la charge CPU** : dans un autre terminal, taper `htop` pour visualiser tous les cœurs occupés à 100 %.

---

## 5. Rapatrier les résultats sur la machine locale

Depuis PowerShell sur le PC local (racine de `c:\Projet_Jeu`) :

```powershell
scp -i "C:\Users\antoi\Documents\Projet Jeu\ssh-key-2026-10-18.key" -r opc@141.145.218.127:~/Projet_Jeu/res_vm/ ./resultats/
```

*Alternative* : utiliser le script `scripts/publier_resultats.sh` directement depuis la VM pour pousser les résultats vers la branche `resultats` du dépôt GitHub.

---

## 6. Pilotage du budget et des coûts (Essai 300 $)

1. **Plafond d'alerte** : configuré dans *Billing & Cost Management $\rightarrow$ Budgets* avec des alertes email à 50 % (125 $), 80 % (200 $) et 90 % (225 $).
2. **Arrêt hors campagne** : lorsque aucune campagne n'est en cours, arrêter l'instance via la console OCI (*Compute $\rightarrow$ Instances $\rightarrow$ Stop*). Les cœurs CPU ne sont plus facturés à l'arrêt.
3. **Transition post-essai 30 jours (Toujours gratuit)** :
   Pour conserver une machine permanente à $0\,\text{€}$ sans limite de temps après l'essai, ajuster la forme sur **Ampere A1 Flex** avec au plus **4 OCPUs et 24 Go de RAM** (*Always Free Eligible*).

---

## 7. Déployer et mettre à jour l'Atelier de conception sur la VM Oracle Linux (`opc@vm-campagne-tests`)

La VM `vm-campagne-tests` tourne sous **Oracle Linux** (gestionnaire de paquets `dnf`, pare-feu `firewalld`, gestionnaire de services `systemd`).

Le script **`scripts/deploy-vm.sh`** automatise l'intégralité du déploiement initial **et** des mises à jour futures en une seule commande, tout en préservant vos données créées sur la VM (`resultats/atelier-v1-state.json`).

### 7.1. Prérequis unique dans la console Web Oracle Cloud (Règle de trafic entrant / Ingress Rule)

À faire une seule fois dans l'interface web d'Oracle Cloud en français :

**Chemin d'accès :**
1. Cliquez sur le menu de navigation (les 3 traits en haut à gauche $\equiv$).
2. Allez dans **Réseau** (Networking) $\rightarrow$ **Réseaux cloud virtuels** (Virtual Cloud Networks).
3. Cliquez sur le nom de votre réseau virtuel (ex. **`VCN-Tests-Jeu`** ou le VCN créé avec votre VM).
4. Dans le volet de gauche sous **Ressources**, cliquez sur **Listes de sécurité** (Security Lists).
5. Cliquez sur la liste de sécurité de votre sous-réseau public (souvent appelée **`Default Security List for...`**).
6. Cliquez sur le bouton bleu **Ajouter des règles de trafic entrant** (Add Ingress Rules).

*(Astuce alternative encore plus rapide : depuis la fiche de votre instance dans **Compute** $\rightarrow$ **Instances** $\rightarrow$ `vm-campagne-tests`, descendez dans la section **Sous-réseau**, cliquez sur le lien de votre sous-réseau public, puis cliquez sur sa **Liste de sécurité**).*

**Formulaire à renseigner :**
- **Type de source** : `Bloc CIDR` (laissé par défaut)
- **CIDR source** : `0.0.0.0/0`
- **Protocole IP** : `TCP`
- **Plage de ports source** : *laisser vide* (tous les ports sources autorisés)
- **Plage de ports de destination** : `3000`
- **Description** : `Atelier de conception Web`
- Cliquez sur le bouton bleu en bas : **Ajouter des règles de trafic entrant**.

### 7.2. Premier déploiement sur la VM (`opc@vm-campagne-tests`)

Une fois le code synchronisé sur votre dépôt GitHub (`https://github.com/antoineacquaviva/Projet_Jeu`), lancez sur la VM :

```bash
cd ~/Projet_Jeu && git pull
bash scripts/deploy-vm.sh
```

Ce que fait automatiquement `scripts/deploy-vm.sh` :
1. **Node.js 20 LTS** : Installe Node.js 20 via `sudo dnf module enable nodejs:20 -y && sudo dnf install -y nodejs git`.
2. **Protection des données** : Sauvegarde `resultats/atelier-v1-state.json` avant le `git reset --hard origin/main`, puis le restaure (au démarrage, `server.ts` fusionne automatiquement les nouvelles versions/variantes/idées du code avec vos données existantes sur la VM).
3. **Compilation** : Exécute `npm install` et `npm run build`.
4. **Pare-feu OS (`firewalld`)** : Ouvre automatiquement le port `3000/tcp` de manière permanente (`sudo firewall-cmd --permanent --add-port=3000/tcp && sudo firewall-cmd --reload`).
5. **Service `systemd` (`atelier-conception.service`)** : Configure et active le démon système natif (démarrage automatique au boot de la VM, relance automatique en cas d'arrêt).
6. **Commande raccourcie `maj-atelier`** : Crée la commande globale `/usr/local/bin/maj-atelier`.

### 7.3. Déploiements ultérieurs (en 1 seul mot)

À chaque fois qu'une nouvelle évolution de l'Atelier ou une nouvelle version du Jeu (V0.3, V0.4...) est poussée sur GitHub, connectez-vous à la VM et tapez simplement :

```bash
maj-atelier
```

En ~10 secondes :
- Le nouveau code est récupéré et compilé ;
- Vos idées du Labo, variantes et bilans de tests déjà présents sur la VM sont conservés et enrichis des nouveautés du code ;
- Le service `atelier-conception` redémarre proprement.

### 7.4. Commandes de supervision utiles sur la VM

- **Accès Web** : `http://141.145.218.127:3000`
- **Voir l'état du serveur** : `sudo systemctl status atelier-conception`
- **Suivre les journaux en direct** : `sudo journalctl -u atelier-conception -f`
- **Redémarrer manuellement** : `sudo systemctl restart atelier-conception`

