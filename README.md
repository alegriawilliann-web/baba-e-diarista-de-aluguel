# Baba de Aluguel — app

App React empacotado com [Capacitor](https://capacitorjs.com) para rodar como app nativo no Android e, futuramente, no iOS.

## Estrutura

- `src/App.jsx` — o app (seu componente React original).
- `android/` — projeto nativo Android (Gradle), gerado pelo Capacitor. Pode ser aberto direto no Android Studio.
- `capacitor.config.json` — configuração do Capacitor (appId, nome, pasta web).
- `scripts/dev-android.mjs` — builda, instala e abre o app no celular conectado via USB, já apontado para o servidor de desenvolvimento (live-reload). Existe porque no Windows o comando `npx cap run android` do próprio Capacitor CLI falha (ele chama `./gradlew`, que o Windows não resolve).

## Ambiente já instalado nesta máquina

- Node/npm
- Git
- JDK 21 (Eclipse Temurin) — `JAVA_HOME` configurado
- Android SDK em `%LOCALAPPDATA%\Android\Sdk` — `ANDROID_HOME`/`ANDROID_SDK_ROOT` configurados, com `platform-tools` e `platforms/android-36` + `build-tools 36.0.0` já presentes.

Se abrir um terminal **novo** essas variáveis já devem estar disponíveis. Se abrir o mesmo terminal que estava aberto antes da configuração, feche e abra de novo.

## Desenvolver com o celular no USB (live-reload)

1. Ligue a depuração USB no celular e conecte o cabo (já feito).
2. Rode o servidor de desenvolvimento (deixe essa janela aberta):
   ```
   npm run dev
   ```
3. Em outro terminal, builde e instale o app apontando para esse servidor:
   ```
   npm run android:dev
   ```
   Isso builda o app nativo uma vez, instala no celular via `adb`, cria o túnel `adb reverse` (não precisa de Wi-Fi, só o cabo USB) e abre o app.
4. A partir daí, **basta salvar `src/App.jsx`** (ou qualquer arquivo em `src/`) que o app no celular atualiza sozinho, sem precisar reinstalar nada.
5. Se o celular desconectar/reconectar, ou você reiniciar o PC, só rode `npm run android:dev` de novo (o passo 2 precisa estar rodando).

### Se algo não carregar no celular

- Confira que o celular aparece como `device` (não `unauthorized`) em `adb devices`.
- Confira que `npm run dev` está rodando e mostrando `http://127.0.0.1:5173`.
- `npm run android:dev` já roda o `adb reverse` sozinho e mantém um vigia (`scripts/watch-adb-reverse.mjs`) reaplicando o túnel automaticamente sempre que o cabo USB reconectar (isso derruba o túnel e causa a tela de "Página da Web não disponível"). Se precisar refazer manualmente: `adb reverse tcp:5173 tcp:5173`.
- O `vite.config.js` fixa `server.host: '127.0.0.1'` de propósito: por padrão o Vite escuta só em IPv6 (`::1`) nesta máquina, mas o túnel `adb reverse` conecta via IPv4, o que gerava `net::ERR_EMPTY_RESPONSE` no celular mesmo com o servidor rodando normalmente no PC.

## Gerar o .apk / .aab para publicar na Play Store (Android)

1. Build de produção (usa os arquivos estáticos de `dist/`, não o servidor de dev):
   ```
   npm run cap:sync
   cd android
   gradlew.bat assembleRelease
   ```
   Isso gera um `.apk` **não assinado** em `android/app/build/outputs/apk/release/`.
2. Para publicar na Play Store você precisa de um **Android App Bundle assinado** (`.aab`), não um apk solto:
   - Gere uma keystore uma única vez (guarde esse arquivo e as senhas em local seguro — **se perder, não consegue mais atualizar o app publicado**):
     ```
     keytool -genkeypair -v -keystore baba-de-aluguel-release.keystore -alias baba-de-aluguel -keyalg RSA -keysize 2048 -validity 10000
     ```
   - Configure a assinatura em `android/app/build.gradle` (bloco `signingConfigs`/`buildTypes.release`) apontando pra essa keystore, ou use variáveis de ambiente/`gradle.properties` (não versionadas) para não expor as senhas no repositório.
   - Gere o bundle:
     ```
     gradlew.bat bundleRelease
     ```
     Saída: `android/app/build/outputs/bundle/release/app-release.aab` — é esse arquivo que sobe no Google Play Console.
3. Antes de publicar, defina o `appId` definitivo em `capacitor.config.json` e em `android/app/build.gradle` (`applicationId`). Hoje está como placeholder: `com.babadealuguel.app`. **Isso não pode mudar depois do primeiro envio à loja.**

## Preparar para iOS

Build de iOS **exige um Mac com Xcode** — não tem como compilar/assinar um app iOS a partir do Windows, isso é uma restrição da Apple, não do Capacitor. O projeto já está pronto para quando você tiver acesso a um Mac (próprio, emprestado, ou um serviço de CI na nuvem):

1. Em um Mac, com Node instalado e o repositório clonado:
   ```
   npm install
   npx cap add ios
   npx cap sync ios
   npx cap open ios
   ```
2. Isso abre o projeto no Xcode, onde você configura o Bundle Identifier, ícones, certificados/provisioning profile da sua conta Apple Developer, e faz o build/arquivamento para a App Store.
3. Alternativa sem Mac próprio: serviços como **Codemagic**, **Ionic Appflow** ou um runner **macOS do GitHub Actions** conseguem rodar `cap add ios` + build + assinatura na nuvem a partir deste mesmo repositório.

Nenhuma mudança de código é necessária para isso — o mesmo `src/App.jsx` roda nas duas plataformas, o Capacitor só empacota o build web (`dist/`) dentro do app nativo de cada uma.
