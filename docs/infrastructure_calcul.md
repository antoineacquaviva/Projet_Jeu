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
