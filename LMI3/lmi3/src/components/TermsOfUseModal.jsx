import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from "@mui/material";

const TermsOfUseModal = ({ open, onClose }) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      scroll="paper"
      maxWidth="md"
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: 3,
          bgcolor: 'background.paper',
          backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.05))',
        }
      }}
    >
      <DialogTitle sx={{ 
        borderBottom: '1px solid', 
        borderColor: 'divider',
        background: 'linear-gradient(45deg, #ff9800 30%, #ffb74d 90%)',
        backgroundClip: 'text',
        textFillColor: 'transparent',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        fontWeight: 'bold'
      }}>
        Conditions Générales d'Utilisation
      </DialogTitle>
      <DialogContent dividers sx={{ p: 3 }}>
        <Typography paragraph>
          <strong>1. Acceptation des Conditions</strong>
        </Typography>
        <Typography paragraph>
          En accédant et en utilisant notre service de commande en ligne, vous acceptez d'être lié par ces Conditions Générales d'Utilisation. Si vous n'acceptez pas ces conditions, vous ne devez pas utiliser notre service.
        </Typography>

        <Typography paragraph>
          <strong>2. Description du Service</strong>
        </Typography>
        <Typography paragraph>
          Notre service permet aux utilisateurs de commander des plats et des boissons en ligne auprès de notre établissement "Rudy et Fanny".
        </Typography>

        <Typography paragraph>
          <strong>3. Compte Utilisateur</strong>
        </Typography>
        <Typography paragraph>
          Pour utiliser certaines fonctionnalités de notre service, vous devez créer un compte. Vous êtes responsable de maintenir la confidentialité de votre compte et mot de passe et de restreindre l'accès à votre ordinateur. Vous acceptez la responsabilité de toutes les activités qui se produisent sous votre compte.
        </Typography>

        <Typography paragraph>
          <strong>4. Commandes et Paiements</strong>
        </Typography>
        <Typography paragraph>
          En passant une commande via notre service, vous proposez d'acheter les produits sélectionnés aux prix indiqués. Toutes les commandes sont soumises à acceptation et disponibilité. Nous nous réservons le droit de refuser une commande pour quelque raison que ce soit.
        </Typography>

        <Typography paragraph>
          <strong>5. Livraison</strong>
        </Typography>
        <Typography paragraph>
          Nous nous efforçons de livrer vos commandes dans les délais indiqués lors de la commande. Cependant, les délais de livraison sont des estimations et ne sont pas garantis. Nous ne sommes pas responsables des retards de livraison dus à des événements indépendants de notre contrôle.
        </Typography>

        <Typography paragraph>
          <strong>6. Annulations et Remboursements</strong>
        </Typography>
        <Typography paragraph>
          Les commandes peuvent être annulées avant qu'elles ne soient préparées. Une fois qu'une commande est en préparation, elle ne peut plus être annulée. Les remboursements sont traités conformément à notre politique de remboursement en vigueur.
        </Typography>

        <Typography paragraph>
          <strong>7. Données Personnelles</strong>
        </Typography>
        <Typography paragraph>
          Nous collectons et traitons vos données personnelles conformément à notre Politique de Confidentialité. En utilisant notre service, vous consentez à cette collecte et à ce traitement.
        </Typography>

        <Typography paragraph>
          <strong>8. Propriété Intellectuelle</strong>
        </Typography>
        <Typography paragraph>
          Tout le contenu de notre service, y compris les textes, graphiques, logos, images, et logiciels, est la propriété de Rudy et Fanny ou de ses fournisseurs de contenu et est protégé par les lois belges et internationales sur le droit d'auteur.
        </Typography>

        <Typography paragraph>
          <strong>9. Limitation de Responsabilité</strong>
        </Typography>
        <Typography paragraph>
          Dans toute la mesure permise par la loi, Rudy et Fanny ne sera pas responsable des dommages indirects, spéciaux, accessoires ou consécutifs résultant de l'utilisation ou de l'impossibilité d'utiliser notre service.
        </Typography>

        <Typography paragraph>
          <strong>10. Modifications des Conditions</strong>
        </Typography>
        <Typography paragraph>
          Nous nous réservons le droit de modifier ces conditions à tout moment. Les modifications prendront effet dès leur publication sur notre service. Votre utilisation continue du service après la publication des modifications constitue votre acceptation de ces modifications.
        </Typography>

        <Typography paragraph>
          <strong>11. Loi Applicable</strong>
        </Typography>
        <Typography paragraph>
          Ces conditions sont régies et interprétées conformément aux lois belges, sans égard aux principes de conflits de lois.
        </Typography>

        <Typography paragraph>
          <strong>12. Contact</strong>
        </Typography>
        <Typography paragraph>
          Si vous avez des questions concernant ces conditions, veuillez nous contacter à info@rudyetfanny.be.
        </Typography>

        <Typography paragraph>
          Dernière mise à jour : 14 août 2025
        </Typography>
      </DialogContent>
      <DialogActions sx={{ p: 2, justifyContent: 'center' }}>
        <Button 
          onClick={onClose}
          variant="contained"
          sx={{
            background: 'linear-gradient(45deg, #ff9800 30%, #ffb74d 90%)',
            '&:hover': {
              background: 'linear-gradient(45deg, #f57c00 30%, #ff9800 90%)',
            },
            borderRadius: 2,
            px: 4
          }}
        >
          J'ai compris
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TermsOfUseModal;
