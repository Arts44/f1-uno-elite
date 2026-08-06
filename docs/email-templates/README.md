# Email templates (Supabase)

## `otp-magic-link.html` — code OTP / lien magique

Template de l'e-mail de connexion cloud (code à 8 chiffres + lien de
secours). Contraintes e-mail respectées : tables + styles inline
uniquement, pas de webfonts ni d'images, ~600 px, sombre par design
(sûr dans les modes clair et sombre de Gmail, Apple Mail et Outlook).
Variables Supabase : `{{ .Token }}` (code) et `{{ .ConfirmationURL }}`
(lien de secours — conservé volontairement : le texte de l'app promet
que « le lien de l'e-mail marche aussi dans un navigateur »).

### Installer dans Supabase

1. Dashboard Supabase → projet de l'app → **Authentication** →
   **Emails** (ou *Email Templates* selon la version du dashboard).
2. Onglet **Magic Link** (c'est ce template qui porte le code OTP
   `{{ .Token }}` pour le flux `signInWithOtp`).
3. **Subject** : `Ton code F1 UNO Élite : {{ .Token }}`
4. **Body (source HTML)** : coller le contenu intégral de
   `otp-magic-link.html` (bouton `<> Source` si l'éditeur est en mode
   visuel), puis **Save**.
5. Si l'expiration OTP du projet n'est pas 3600 s (Authentication →
   Providers → Email → *Email OTP expiration*), ajuster la mention
   « 1 heure » dans le template.

### Tester

1. Dans l'app → onglet **Compte** → « M'envoyer un lien de connexion »
   avec ta vraie adresse.
2. Vérifier dans Gmail/Apple Mail : rendu sombre, code lisible et
   copiable, préheader « Ton code de connexion… » dans l'aperçu.
3. Saisir le code dans les cases OTP de l'app → coche verte ;
   re-tester une fois en cliquant le lien de secours à la place.

### Langue

Bilingue FR (dominant) / EN (ligne discrète) : Supabase n'expose pas
la langue de l'utilisateur dans le template (mono-langue par projet),
et un envoi multilingue exigerait un serveur SMTP custom ou un hook —
disproportionné ici. Le compact FR/EN couvre tous les cas.
