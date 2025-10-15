"use client"

import React from "react"
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  useMediaQuery,
  useTheme,
  Box,
  Divider,
  Chip,
  List,
  ListItem,
  ListItemText,
} from "@mui/material"
import {
  HelpOutline as HelpIcon,
  ReceiptLong as OrdersIcon,
  Fastfood as PlatsIcon,
  Restaurant as SaucesIcon,
  Add as ExtrasIcon,
  Kitchen as IngredientsIcon,
  LocalOffer as TagsIcon,
  People as UsersIcon,
  Settings as SettingsIcon,
  Info as InfoIcon,
} from "@mui/icons-material"
import config from "../config"

const SectionTitle = ({ icon, children }) => (
  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 3, mb: 1 }}>
    {icon}
    <Typography variant="h6" sx={{ fontWeight: 700, color: "#ff9800" }}>
      {children}
    </Typography>
  </Box>
)

const InlineKbd = ({ children }) => (
  <Box component="kbd" sx={{
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    fontSize: '0.85em',
    px: 1,
    py: 0.25,
    borderRadius: 1,
    border: '1px solid',
    borderColor: 'divider',
    bgcolor: 'background.paper',
    display: 'inline-block'
  }}>{children}</Box>
)

export default function HelpModal({ open, onClose }) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"))

  return (
    <Dialog
      open={open}
      onClose={onClose}
      scroll="paper"
      maxWidth="md"
      fullScreen={isMobile}
      aria-labelledby="admin-help-title"
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: isMobile ? 0 : 3,
          bgcolor: 'background.paper',
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.04), rgba(255,255,255,0.04))',
        }
      }}
    >
      <DialogTitle id="admin-help-title" sx={{
        borderBottom: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        alignItems: 'center',
        gap: 1
      }}>
        <HelpIcon sx={{ color: '#ff9800' }} />
        <Typography component="span" variant="h6" sx={{ fontWeight: 800 }}>
          Guide d'utilisation – Administration
        </Typography>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ color: 'text.secondary' }}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Ce guide présente chaque section du panneau d'administration pour vous aider à gérer le site efficacement.
          </Typography>

          <Chip label={`API: ${config.API_URL}`} size="small" sx={{ mb: 2, bgcolor: 'rgba(255,152,0,0.1)', borderColor: 'rgba(255,152,0,0.3)', color: '#ffb74d' }} variant="outlined" />

          <Divider />

          {/* Architecture & Données */}
          <SectionTitle icon={<InfoIcon sx={{ color: '#ff9800' }} />}>Architecture & Données</SectionTitle>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Structure principale des données (extrait):
          </Typography>
          <List dense sx={{ pl: 2 }}>
            <ListItem><ListItemText primary="User" secondary="email (unique), name, phone (unique), password (hash), salt, type (0=user, 1=admin), enabled (accès)." /></ListItem>
            <ListItem><ListItemText primary="Plat / PlatVersion" secondary="Plat: name (unique), price, image, available, saucePrice. Version: size (unique par plat), extraPrice, image." /></ListItem>
            <ListItem><ListItemText primary="Sauce / Extra / Ingredient / Tags" secondary="Catalogue et attributs (prix, disponibilité) + relations (tags↔plats/sauces/extras, ingrédients↔plats)." /></ListItem>
            <ListItem><ListItemText primary="Order / OrderItem" secondary="Order: totalPrice, status, type (takeout/delivery), timestamps; Items: unitPrice, totalPrice, versionSize, sauces/extras/ingrédients retirés." /></ListItem>
            <ListItem><ListItemText primary="OrderHours / Settings / RestaurantConfig" secondary="Heures de prise de commande (HH:MM), paramètres typés (string/boolean/number/time), et mode d'ouverture (auto/manual)." /></ListItem>
          </List>

          <SectionTitle icon={<InfoIcon sx={{ color: '#ff9800' }} />}>Prise en main</SectionTitle>
          <List dense sx={{ pl: 2 }}>
            <ListItem>
              <ListItemText
                primary="Navigation"
                secondary="Utilisez les onglets en haut pour changer de section (Commandes, Plats, Sauces, etc.). Sur mobile, vous pouvez faire défiler les onglets horizontalement."
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Champs requis"
                secondary="Les formulaires marquent les champs obligatoires. En cas d'erreur, un message s'affiche et la ligne concernée est mise en évidence."
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Actions courantes"
                secondary="Ajouter, Modifier, Supprimer sont visibles sous forme de boutons ou d'actions par ligne dans les tableaux. Certaines tables ont une barre d'outils (filtre, export)."
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Raccourcis utiles"
                secondary={<>
                  <InlineKbd>Ctrl</InlineKbd> + <InlineKbd>F</InlineKbd> pour chercher,
                  <Box component="span" sx={{ ml: 1 }}>
                    <InlineKbd>Esc</InlineKbd> pour fermer les fenêtres/modales.
                  </Box>
                </>}
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Formats et validations importantes"
                secondary={<>
                  <Box sx={{ mb: 1 }}>
                    <strong>Téléphone (format attendu)</strong> — format international ou national: <InlineKbd>+XXXXXXXXXXXX</InlineKbd> (ex: <InlineKbd>+32470123456</InlineKbd>) ou <InlineKbd>0XXXXXXXXX</InlineKbd> (ex: <InlineKbd>0470123456</InlineKbd>). Seuls les chiffres et <InlineKbd>+</InlineKbd> sont acceptés; autres caractères sont retirés automatiquement. Longueur totale entre 10 et 16 chiffres après normalisation.
                  </Box>
                  <Box>
                    <strong>Mot de passe</strong> — minimum 8 caractères recommandé (le backend applique au minimum 6), évitez les suites répétées (<InlineKbd>aaa</InlineKbd>) et les valeurs faibles (<InlineKbd>123456</InlineKbd>, <InlineKbd>password</InlineKbd>, <InlineKbd>qwerty</InlineKbd>, <InlineKbd>admin</InlineKbd>). Idéalement inclure minuscule, majuscule et chiffre.
                  </Box>
                </>}
              />
            </ListItem>
          </List>

          <Divider sx={{ my: 2 }} />

          {/* Authentification & Sécurité */}
          <SectionTitle icon={<InfoIcon sx={{ color: '#ff9800' }} />}>Authentification & Sécurité</SectionTitle>
          <List dense sx={{ pl: 2 }}>
            <ListItem><ListItemText primary="Flux de connexion" secondary="1) Le client demande un sel via /users/getSalt. 2) Hash SHA-256 du mot de passe concaténé au sel côté client. 3) Envoi à /users/login. 4) Un token JWT est renvoyé si succès." /></ListItem>
            <ListItem><ListItemText primary="Profil" secondary="/users/profile (GET) vérifie/retourne l'utilisateur courant; /users/profile (PUT) met à jour le téléphone (format et unicité vérifiés)." /></ListItem>
            <ListItem><ListItemText primary="Changement de mot de passe" secondary="/users/password (PUT) attend un mot de passe déjà hashé + un nouveau sel; contraintes minimales (longueur hash ≥ 32)." /></ListItem>
            <ListItem><ListItemText primary="Erreurs courantes" secondary="401 Email/mot de passe invalide; 403 Compte suspendu; 400 champs manquants/invalides; 409 doublon (téléphone)." /></ListItem>
          </List>

          <Divider sx={{ my: 2 }} />

          {/* Calculs & Totaux */}
          <SectionTitle icon={<InfoIcon sx={{ color: '#ff9800' }} />}>Calculs & Totaux</SectionTitle>
          <List dense sx={{ pl: 2 }}>
            <ListItem><ListItemText primary="Côté client (aperçu)" secondary="Pour un plat: prix du plat + extraPrice de la version + (éventuel) plat.saucePrice si une sauce est choisie + somme des extras; multiplié par la quantité." /></ListItem>
            <ListItem><ListItemText primary="Côté serveur (source de vérité)" secondary="Recalcule à partir des IDs: base plat + version.extraPrice; ajoute sauce.price (sauceId), extra.price (extraId), platSauce.price (platSauceId), et chaque addedExtra. Valide l'existence des IDs." /></ListItem>
            <ListItem><ListItemText primary="Frais de livraison" secondary="OrderType=takeout: 0€. OrderType=delivery: 0€ si total ≥ 25€, sinon 2.50€. Le total final stocké inclut ces frais." /></ListItem>
            <ListItem><ListItemText primary="Conseil" secondary="Le montant montré côté client est indicatif; le serveur fait foi et peut ajuster selon la base de données (prix/plats/sauces/extras)." /></ListItem>
          </List>

          <SectionTitle icon={<OrdersIcon sx={{ color: '#ff9800' }} />}>Commandes</SectionTitle>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Surveillez et gérez les commandes en temps réel.
          </Typography>
          <List dense sx={{ pl: 2 }}>
            <ListItem><ListItemText primary="Vue d'ensemble" secondary="Navigation par créneaux rapides, compteur par statut, tri/filtre via la barre d'outils. Cliquez sur une commande pour voir les détails (items, sauces, extras, ingréd., total, client)." /></ListItem>
            <ListItem><ListItemText primary="Statuts" secondary="Faites évoluer une commande: En attente → Préparation → Prête → Livrée/Retirée. Les changements sont persistés côté serveur et visibles par la caisse/borne." /></ListItem>
            <ListItem><ListItemText primary="Contact client" secondary="Si le numéro est présent, bouton d'appel direct (tel:). Respectez le format de téléphone ci-dessus pour garantir le lien cliquable." /></ListItem>
            <ListItem><ListItemText primary="Chat de commande" secondary="Échangez des messages avec le client (si activé). Les messages sont validés et enregistrés avec l'identité d'expéditeur." /></ListItem>
          </List>

          {/* Erreurs typiques (Commandes) */}
          <Typography variant="body2" sx={{ mb: 1, mt: 1 }}>
            Erreurs typiques (création/consultation de commandes):
          </Typography>
          <List dense sx={{ pl: 2 }}>
            <ListItem><ListItemText primary="400 Items are required" secondary="Le panier envoyé est vide ou invalide." /></ListItem>
            <ListItem><ListItemText primary="400 Each item must have a valid positive quantity" secondary="Une quantité ≤ 0 a été détectée." /></ListItem>
            <ListItem><ListItemText primary="400 Item must have either platId or sauceId" secondary="Chaque item doit référencer un plat ou une sauce valide." /></ListItem>
            <ListItem><ListItemText primary="400 … not found" secondary="ID de plat/sauce/extra/ingrédient inconnu. Vérifiez que l'élément existe et est disponible." /></ListItem>
            <ListItem><ListItemText primary="404 Order not found" secondary="Consultation d'une commande inexistante ou ne vous appartenant pas." /></ListItem>
          </List>

          <Divider sx={{ my: 2 }} />

          <SectionTitle icon={<PlatsIcon sx={{ color: '#ff9800' }} />}>Plats</SectionTitle>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Créez et maintenez le menu principal.
          </Typography>
          <List dense sx={{ pl: 2 }}>
            <ListItem><ListItemText primary="Champs requis" secondary="Nom, prix, disponibilité. Description et image sont recommandés. Les validations empêchent des prix négatifs et garantissent la cohérence des relations (tags, sauces, extras, ingrédients)." /></ListItem>
            <ListItem><ListItemText primary="Ajouter/Modifier" secondary="Nom, description, prix (nombre), image, disponibilité (interrupteur). Associez ingrédients (par défaut/retirables), sauces, extras et tags." /></ListItem>
            <ListItem><ListItemText primary="Images" secondary="Utilisez le bouton image pour téléverser. Une prévisualisation s'affiche." /></ListItem>
            <ListItem><ListItemText primary="Disponibilité" secondary="Cochez/décochez pour masquer un plat sans le supprimer." /></ListItem>
          </List>

          <Divider sx={{ my: 2 }} />

          <SectionTitle icon={<SaucesIcon sx={{ color: '#ff9800' }} />}>Sauces</SectionTitle>
          <List dense sx={{ pl: 2 }}>
            <ListItem><ListItemText primary="Catalogue" secondary="Ajoutez/modifiez des sauces, définissez leur disponibilité, tags éventuels et l'association aux plats si le flux le prévoit. Les champs obligatoires sont vérifiés avant envoi." /></ListItem>
          </List>

          <Divider sx={{ my: 2 }} />

          <SectionTitle icon={<ExtrasIcon sx={{ color: '#ff9800' }} />}>Extras</SectionTitle>
          <List dense sx={{ pl: 2 }}>
            <ListItem><ListItemText primary="Options" secondary="Gérez les extras (suppléments, accompagnements), prix (nombre, ≥0) et disponibilité. Les extras peuvent être sélectionnés par le client lors de la commande." /></ListItem>
          </List>

          <Divider sx={{ my: 2 }} />

          <SectionTitle icon={<IngredientsIcon sx={{ color: '#ff9800' }} />}>Ingrédients</SectionTitle>
          <List dense sx={{ pl: 2 }}>
            <ListItem><ListItemText primary="Gestion" secondary="Créez/éditez des ingrédients, marquez ceux inclus par défaut ou retirables par le client. Associez-les aux plats pour contrôler la personnalisation." /></ListItem>
          </List>

          <Divider sx={{ my: 2 }} />

          <SectionTitle icon={<TagsIcon sx={{ color: '#ff9800' }} />}>Tags</SectionTitle>
          <List dense sx={{ pl: 2 }}>
            <ListItem><ListItemText primary="Catégorisation" secondary="Organisez les plats par tags (ex: épicé, végétarien, nouveauté). Les tags améliorent la navigation et peuvent servir à filtrer/mettre en avant." /></ListItem>
          </List>

          <Divider sx={{ my: 2 }} />

          <SectionTitle icon={<UsersIcon sx={{ color: '#ff9800' }} />}>Utilisateurs</SectionTitle>
          <List dense sx={{ pl: 2 }}>
            <ListItem><ListItemText primary="Rôles" secondary="Définissez admin (1) / utilisateur (0). L'interrupteur 'Statut' active/suspend le compte (accès interdit si suspendu)." /></ListItem>
            <ListItem><ListItemText primary="Champs et unicité" secondary="Email et téléphone doivent être uniques. Le téléphone est normalisé (suppression des espaces/traits/parenthèses). Format accepté: +CCXXXXXXXXX ou 0XXXXXXXXX." /></ListItem>
            <ListItem><ListItemText primary="Mot de passe" secondary="La création passe par un sel côté serveur et un hash SHA-256 côté client. Pour changer un mot de passe, utilisez la page Profil/flow de changement; longueur ≥6 côté serveur, mais visez ≥8 avec mélange de caractères." /></ListItem>
          </List>

          {/* Détails des validations (Utilisateurs) */}
          <Typography variant="body2" sx={{ mb: 1, mt: 1 }}>
            Détails des validations (création/mise à jour):
          </Typography>
          <List dense sx={{ pl: 2 }}>
            <ListItem><ListItemText primary="Nom" secondary="Doit contenir uniquement lettres, espaces et chiffres." /></ListItem>
            <ListItem><ListItemText primary="Email" secondary="Format standard RFC (ex: nom@domaine.tld)." /></ListItem>
            <ListItem><ListItemText primary="Téléphone" secondary="Unique, nettoyé puis validé: +CC… ou 0… (9–15 chiffres). Erreurs: 400 format, 409 doublon." /></ListItem>
            <ListItem><ListItemText primary="Mot de passe" secondary="Recommandé ≥8 caractères avec mélange; minimum backend 6 dans certains flux; changement de mot de passe via hash+sel." /></ListItem>
          </List>

          <Divider sx={{ my: 2 }} />

          <SectionTitle icon={<SettingsIcon sx={{ color: '#ff9800' }} />}>Paramètres</SectionTitle>
          <List dense sx={{ pl: 2 }}>
            <ListItem><ListItemText primary="Infos restaurant" secondary="Nom, téléphone du restaurant, etc. Le téléphone suit le même format que ci-dessus." /></ListItem>
            <ListItem><ListItemText primary="Horaires (HH:MM)" secondary="Les champs d'heures valident le format 24h: <InlineKbd>HH:MM</InlineKbd> (ex: 09:00, 18:30)." /></ListItem>
            <ListItem><ListItemText primary="Sauvegarde et diffusion" secondary="Lors d'une sauvegarde, la config est diffusée aux autres composants (par ex. Menu) pour mise à jour immédiate." /></ListItem>
          </List>

          <Divider sx={{ my: 2 }} />

          {/* Téléversement d'images */}
          <SectionTitle icon={<InfoIcon sx={{ color: '#ff9800' }} />}>Téléversement d'images</SectionTitle>
          <List dense sx={{ pl: 2 }}>
            <ListItem><ListItemText primary="Formats" secondary="Le serveur accepte plusieurs formats, y compris HEIC (iPhone). Les images sont traitées et stockées; gardez des tailles raisonnables pour de bonnes performances." /></ListItem>
            <ListItem><ListItemText primary="Conservation d'image" secondary="En cas d'édition sans nouvelle image, l'UI envoie l'indication de garder l'image existante pour éviter les erreurs de validation." /></ListItem>
          </List>

          <Divider sx={{ my: 2 }} />

          <Typography variant="body2" sx={{ mt: 1 }}>
            Besoin d'aide supplémentaire ? Notez l'URL de l'API ci-dessus et contactez le support technique avec une capture d'écran de l'erreur éventuelle.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2, justifyContent: 'center' }}>
        <Button
          onClick={onClose}
          variant="contained"
          sx={{
            background: 'linear-gradient(45deg, #ff9800 30%, #ffb74d 90%)',
            '&:hover': { background: 'linear-gradient(45deg, #f57c00 30%, #ff9800 90%)' },
            borderRadius: 2,
            px: 4
          }}
        >
          J'ai compris
        </Button>
      </DialogActions>
    </Dialog>
  )
}
