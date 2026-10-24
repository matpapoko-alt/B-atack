# Back Attack — base multijoueur

Ce dossier fournit une **base serveur Node.js + WebSocket** et un adaptateur navigateur. Il ne remplace pas le jeu existant.

## Important : ce qui est prêt et ce qui ne l'est pas

Le serveur inclut :
- salons privés avec codes aléatoires de 6 caractères ;
- limite de 4 joueurs ;
- lobby et statut prêt ;
- départ avec compte à rebours ;
- messages réseau et diffusion d'état périodique ;
- jeton de reconnexion temporaire ;
- endpoint `/health`.

**Ce n'est pas encore une implémentation complète des règles du jeu.** La simulation autoritaire exacte des rails, les déplacements sur le graphe des rails, les boulets de canon, les impacts dans le dos, les éliminations et les boosts aléatoires doivent être raccordés au modèle réel de la carte et aux règles du projet existant. Le serveur ne doit pas faire confiance aux positions envoyées par les clients.

## 1. Prérequis

Installez Node.js 20 ou plus récent : https://nodejs.org/

## 2. Lancer localement

Dans un terminal, ouvrez le dossier `server`, puis exécutez :

```bash
npm install
npm run dev
```

Le serveur écoute par défaut sur `http://localhost:8080` et `ws://localhost:8080`.
Test santé : ouvrez `http://localhost:8080/health`.

## 3. Hébergement

Déployez le dossier `server` sur un hébergeur Node.js qui prend en charge les WebSockets. Configurez la commande de démarrage `npm start`. L'hébergeur doit fournir le TLS/HTTPS pour permettre l'usage de `wss://`.

Une option de test peut être Render : https://render.com/docs/web-services
Les offres gratuites et leurs limites peuvent changer ; vérifiez les conditions actuelles avant de déployer.

Après déploiement, testez l'URL `/health`. L'adresse publique doit ressembler à `https://votre-service...`; l'adresse WebSocket correspondante sera `wss://votre-service...`.

## 4. Connecter le client

Le fichier `client/multiplayer-client.js` est un adaptateur générique. Il doit être importé par le code du jeu existant et ses événements doivent être reliés aux menus, aux contrôles et à l'affichage de l'état réseau.

Avant de le connecter :
1. identifiez le fichier qui initialise le jeu ;
2. identifiez comment les rails, véhicules, boosts, projectiles, collisions et scores sont représentés ;
3. reliez les messages reçus à ces objets ;
4. remplacez les calculs locaux des règles compétitives par des résultats validés par le serveur ;
5. testez deux navigateurs distincts, puis trois ou quatre joueurs.

Ne mettez pas `YOUR-SERVER-HOST` en production. Configurez l'URL réelle du serveur dans `BACK_ATTACK_SERVER_URL`.

## 5. Protocole réseau prévu

Client vers serveur :
- `room:create` : `{ name, mapId }`
- `room:join` : `{ code, name }`
- `room:reconnect` : `{ code, playerId, reconnectToken }`
- `player:ready` : `{ ready, start }`
- `game:start`
- `game:input` : `{ direction, boost, fire }`
- `room:leave`

Serveur vers client :
- `room:created`, `room:joined`, `room:reconnected`
- `room:update`
- `game:countdown`, `game:started`, `game:state`, `game:finished`
- `error`

## 6. Sécurité et limites de cette base

- En production, utilisez uniquement `wss://`.
- Ne faites jamais confiance au score, à la position ou aux éliminations annoncés par un client.
- Ajoutez une validation serveur spécifique à la géométrie de vos rails.
- Pour une vraie reconnexion, stockez l'identité côté client et sécurisez le jeton. Le squelette conserve les salons uniquement en mémoire : un redémarrage du serveur efface les parties.
- Pour un jeu public, ajoutez des limites de fréquence, une politique de nettoyage des salons et des tests de charge.
- Le serveur actuel est un point de départ à adapter ; ne le présentez pas comme prêt pour une sortie publique sans tests.

## 7. Étape nécessaire pour terminer l'intégration

Fournissez le dossier source du jeu existant (ou un ZIP du projet exporté depuis votre outil). Sans ce code, il est impossible de vérifier la compatibilité ou de connecter réellement les commandes, les rails et les collisions sans risquer de casser le jeu.
