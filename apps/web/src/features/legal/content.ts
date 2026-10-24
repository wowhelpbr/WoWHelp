import type { Locale } from '@wowhelp/shared';
import { ADSENSE_CLIENT } from '@/features/ads/config';

// O texto sobre cookies e anúncios acompanha o que está ligado no site.
const ADS_ON = ADSENSE_CLIENT !== null;

// Rascunhos de política de privacidade e termos de uso. Descrevem o que o
// código faz HOJE (tabelas, retenção, operadores). Precisam de revisão
// jurídica antes do beta público (planning/docs/09). Ao mudar o que o site
// coleta, atualizar aqui e em docs/fase-6/checklist-legal.md.

export const LEGAL_VERSION = '2026-10-24';

export interface LegalSection {
  heading: string;
  paragraphs?: string[];
  items?: string[];
}

export interface LegalDocument {
  title: string;
  draftNotice: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
}

const privacy: Record<Locale, LegalDocument> = {
  'pt-BR': {
    title: 'Política de privacidade',
    draftNotice:
      'Rascunho em revisão jurídica. Este texto descreve como o WoWHelp funciona hoje, mas ainda não foi revisado por um profissional e pode mudar antes do beta público.',
    updated: 'Versão de 24/10/2026',
    intro:
      'O WoWHelp é um projeto independente feito por fãs de World of Warcraft, sem afiliação com a Blizzard Entertainment. Esta página explica quais dados guardamos, por que, por quanto tempo e como você controla tudo isso, conforme a Lei Geral de Proteção de Dados (LGPD, Lei 13.709/2018).',
    sections: [
      {
        heading: 'Quem é o responsável',
        paragraphs: [
          'O controlador dos dados e o canal de contato do encarregado (DPO) serão publicados aqui antes do beta público. Enquanto isso, o WoWHelp está em versão de testes, sem divulgação aberta.',
        ],
      },
      {
        heading: 'O que guardamos',
        items: [
          'Conta: e-mail, senha (guardada só como hash, nunca em texto), data de cadastro, idioma, região do jogo e as áreas que você escolheu (por exemplo, montarias ou semanais).',
          'O que você cria: objetivos, passos, tempos estimados, atividades semanais e o que você marcou como feito em cada ciclo.',
          'Se você conectar a Battle.net: identificador da conta Battle.net, BattleTag, região, permissões aprovadas, seus personagens (nome, reino, nível, classe, raça e facção) e os números das montarias coletadas. A chave de acesso da Battle.net é usada na hora e descartada; não guardamos.',
          'Se você importar o arquivo do addon WoWHelp Companion: personagens e montarias que estão no arquivo, a versão do addon, o horário da leitura no jogo, contagens e uma impressão digital (hash) do arquivo para não importar o mesmo duas vezes. O arquivo em si não é guardado.',
          'Marcações manuais de coleção ("já tenho" / "ainda não tenho").',
          'Se você pedir para entrar ou sair da Comunidade BR: o nome, os links e a mensagem que você mandou.',
          ADS_ON
            ? 'Cookies: os necessários (sessão de login, idioma e a sua escolha de cookies) e, só se você aceitar anúncios personalizados, os cookies de publicidade do Google. Não usamos cookies de analytics.'
            : 'Cookies necessários: sessão de login e idioma escolhido. Não usamos cookies de analytics nem de publicidade.',
          'Registros técnicos dos provedores de hospedagem (como endereço IP e navegador), mantidos por eles por tempo limitado para segurança e diagnóstico.',
        ],
        paragraphs: [
          'Não coletamos dados de pagamento, localização precisa, contatos, chat, amigos, guilda nem dados de combate.',
        ],
      },
      {
        heading: 'Para que usamos e com qual base legal',
        items: [
          'Manter sua conta, seus objetivos e o planejador funcionando: execução do serviço que você pediu (LGPD, art. 7º, V).',
          'Conectar a Battle.net e importar o arquivo do addon: seu consentimento (art. 7º, I), que você retira a qualquer momento desconectando a Battle.net ou apagando os dados do addon.',
          'Segurança, limites de uso e prevenção de abuso: legítimo interesse (art. 7º, IX).',
        ],
      },
      {
        heading: 'Por quanto tempo',
        items: [
          'Dados da Battle.net: apagados automaticamente se não forem atualizados em 30 dias, e na hora quando você desconecta.',
          'Dados do addon, objetivos e planejador: até você apagar ou excluir a conta.',
          'Ao excluir a conta, apagamos todos os dados dela do banco na hora. Cópias de segurança automáticas do provedor, quando existirem, expiram no ciclo do provedor.',
        ],
      },
      {
        heading: 'Com quem os dados são tratados',
        items: [
          'Supabase: banco de dados e login. Servidores nos Estados Unidos (Oregon).',
          'Vercel: hospedagem do site, com rede global.',
          'Blizzard Entertainment: só quando você conecta a Battle.net. Você aprova o acesso no site da própria Blizzard e nós recebemos os dados listados acima.',
          'GitHub: roda a atualização automática do catálogo de montarias (sem dados de jogadores).',
        ],
        paragraphs: [
          'Por isso há transferência internacional de dados para os Estados Unidos (LGPD, art. 33). Não vendemos nem alugamos dados.',
        ],
      },
      ...(ADS_ON
        ? [
            {
              heading: 'Anúncios',
              paragraphs: [
                'O WoWHelp mostra anúncios do Google AdSense para se manter grátis. Na primeira visita você escolhe: anúncios personalizados (o Google usa cookies de publicidade, com base no seu consentimento, LGPD art. 7º, I) ou só o necessário (anúncios não personalizados). Dá para mudar a escolha a qualquer momento em "Preferências de cookies", no rodapé. Nenhum dado da sua conta, dos seus personagens ou da Battle.net é enviado para anunciantes. Mais sobre como o Google usa dados: https://policies.google.com/technologies/partner-sites',
              ],
            },
          ]
        : []),
      {
        heading: 'Criadores na Comunidade BR',
        paragraphs: [
          'A Comunidade BR lista criadores brasileiros de World of Warcraft escolhidos pela equipe. Mostramos o nome, a apresentação, os links dos canais e informações que já são públicas nas plataformas (como foto do canal, título da live e último vídeo, pelas APIs oficiais da Twitch e do YouTube). A base legal é o legítimo interesse de divulgar conteúdo público da comunidade (LGPD, art. 7º, IX). Quem não quiser aparecer pode pedir para sair a qualquer momento na própria página da Comunidade.',
        ],
      },
      {
        heading: 'Seus direitos e como exercer',
        items: [
          'Ver e levar seus dados: Configurações > Baixar meus dados (arquivo JSON com tudo).',
          'Corrigir: edite objetivos, preferências e marcações no próprio site.',
          'Apagar: Configurações > Excluir conta (apaga tudo na hora). Também dá para apagar só a Battle.net (Personagens > Desconectar) ou só o addon (Importar addon > Apagar dados do addon).',
          'Retirar o consentimento: desconectar a Battle.net ou apagar os dados do addon.',
          'Saber com quem compartilhamos: esta página.',
        ],
      },
      {
        heading: 'Segurança',
        paragraphs: [
          'Cada conta só enxerga os próprios dados (regras de acesso no banco, testadas automaticamente), a conexão é sempre criptografada (HTTPS), a senha fica só como hash e o arquivo do addon é lido sem executar nenhum código.',
        ],
      },
      {
        heading: 'Menores de idade',
        paragraphs: [
          'Se você tem menos de 18 anos, use o WoWHelp com o conhecimento de quem é responsável por você. A idade mínima e as regras para adolescentes (LGPD, art. 14) serão definidas na revisão jurídica.',
        ],
      },
      {
        heading: 'Mudanças nesta política',
        paragraphs: [
          'Quando esta política mudar, a data no topo muda junto e avisamos no site se a mudança afetar o que guardamos.',
        ],
      },
    ],
  },
  'en-US': {
    title: 'Privacy policy',
    draftNotice:
      'Draft under legal review. This text describes how WoWHelp works today, but it has not been reviewed by a lawyer yet and may change before the public beta.',
    updated: 'Version of October 24, 2026',
    intro:
      "WoWHelp is an independent, fan-made World of Warcraft project, not affiliated with Blizzard Entertainment. This page explains what data we keep, why, for how long and how you control it, following Brazil's General Data Protection Law (LGPD, Law 13,709/2018).",
    sections: [
      {
        heading: 'Who is responsible',
        paragraphs: [
          'The data controller and the contact for the data protection officer (DPO) will be published here before the public beta. Until then, WoWHelp is a test version without open sign-up promotion.',
        ],
      },
      {
        heading: 'What we keep',
        items: [
          'Account: email, password (stored only as a hash, never as text), sign-up date, language, game region and the areas you chose (for example, mounts or weeklies).',
          'What you create: goals, steps, estimated times, weekly activities and what you marked as done in each cycle.',
          'If you connect Battle.net: your Battle.net account identifier, BattleTag, region, approved permissions, your characters (name, realm, level, class, race and faction) and the IDs of collected mounts. The Battle.net access key is used right away and discarded; we do not keep it.',
          'If you import the WoWHelp Companion addon file: characters and mounts in the file, addon version, in-game read time, counts and a fingerprint (hash) of the file so the same file is not imported twice. The file itself is not kept.',
          'Manual collection marks ("I have it" / "I don\'t have it yet").',
          'If you ask to join or leave the Brazilian community: the name, links and message you sent.',
          ADS_ON
            ? 'Cookies: the necessary ones (sign-in session, language and your cookie choice) and, only if you accept personalized ads, Google advertising cookies. We use no analytics cookies.'
            : 'Necessary cookies: sign-in session and chosen language. We use no analytics or advertising cookies.',
          'Technical logs kept by our hosting providers (such as IP address and browser) for a limited time for security and troubleshooting.',
        ],
        paragraphs: [
          'We do not collect payment data, precise location, contacts, chat, friends, guild or combat data.',
        ],
      },
      {
        heading: 'Why we use it and the legal basis',
        items: [
          'Keeping your account, goals and planner working: performing the service you asked for (LGPD, art. 7, V).',
          'Connecting Battle.net and importing the addon file: your consent (art. 7, I), which you can withdraw at any time by disconnecting Battle.net or deleting addon data.',
          'Security, usage limits and abuse prevention: legitimate interest (art. 7, IX).',
        ],
      },
      {
        heading: 'For how long',
        items: [
          'Battle.net data: deleted automatically if not refreshed within 30 days, and right away when you disconnect.',
          'Addon data, goals and planner: until you delete them or delete your account.',
          'When you delete your account, all of its data is removed from the database right away. Automatic provider backups, where they exist, expire on the provider schedule.',
        ],
      },
      {
        heading: 'Who processes the data',
        items: [
          'Supabase: database and sign-in. Servers in the United States (Oregon).',
          'Vercel: website hosting, on a global network.',
          "Blizzard Entertainment: only when you connect Battle.net. You approve access on Blizzard's own site and we receive the data listed above.",
          'GitHub: runs the automatic mount catalog update (no player data).',
        ],
        paragraphs: [
          'This means data is transferred internationally to the United States (LGPD, art. 33). We do not sell or rent data.',
        ],
      },
      ...(ADS_ON
        ? [
            {
              heading: 'Ads',
              paragraphs: [
                'WoWHelp shows Google AdSense ads to stay free. On your first visit you choose: personalized ads (Google uses advertising cookies, based on your consent, LGPD art. 7, I) or essentials only (non-personalized ads). You can change this anytime in "Cookie preferences" in the footer. No data from your account, characters or Battle.net is sent to advertisers. How Google uses data: https://policies.google.com/technologies/partner-sites',
              ],
            },
          ]
        : []),
      {
        heading: 'Creators in the Brazilian community',
        paragraphs: [
          'The Brazilian community lists Brazilian World of Warcraft creators chosen by the team. We show the name, intro, channel links and information that is already public on each platform (such as channel picture, stream title and latest video, through the official Twitch and YouTube APIs). The legal basis is the legitimate interest of promoting public community content (LGPD, art. 7, IX). Anyone who does not want to appear can ask to be removed at any time on the community page.',
        ],
      },
      {
        heading: 'Your rights and how to use them',
        items: [
          'See and take your data: Settings > Download my data (a JSON file with everything).',
          'Correct: edit goals, preferences and marks on the site.',
          'Delete: Settings > Delete account (removes everything right away). You can also remove only Battle.net (Characters > Disconnect) or only the addon (Addon import > Delete addon data).',
          'Withdraw consent: disconnect Battle.net or delete addon data.',
          'Know who we share with: this page.',
        ],
      },
      {
        heading: 'Security',
        paragraphs: [
          'Each account sees only its own data (database access rules, tested automatically), connections are always encrypted (HTTPS), passwords are kept only as hashes and the addon file is read without running any code.',
        ],
      },
      {
        heading: 'Minors',
        paragraphs: [
          'If you are under 18, use WoWHelp with the knowledge of a parent or guardian. The minimum age and the rules for teenagers (LGPD, art. 14) will be set during legal review.',
        ],
      },
      {
        heading: 'Changes to this policy',
        paragraphs: [
          'When this policy changes, the date at the top changes too, and we will announce it on the site if the change affects what we keep.',
        ],
      },
    ],
  },
};

const terms: Record<Locale, LegalDocument> = {
  'pt-BR': {
    title: 'Termos de uso',
    draftNotice:
      'Rascunho em revisão jurídica. Estes termos ainda não foram revisados por um profissional e podem mudar antes do beta público.',
    updated: 'Versão de 24/10/2026',
    intro:
      'Ao criar uma conta ou usar o WoWHelp, você concorda com estes termos. Leia também a política de privacidade.',
    sections: [
      {
        heading: 'O que é o WoWHelp',
        paragraphs: [
          'Uma ferramenta gratuita, feita por fãs, para organizar objetivos no World of Warcraft Retail. Está em versão de testes. Não é afiliada nem endossada pela Blizzard Entertainment. World of Warcraft e Blizzard Entertainment são marcas da Blizzard Entertainment, Inc.',
        ],
      },
      {
        heading: 'Sua conta',
        items: [
          'Use um e-mail seu e guarde sua senha; o que for feito com a sua conta é responsabilidade sua.',
          'Uma pessoa por conta.',
          'Você pode excluir a conta quando quiser, em Configurações.',
        ],
      },
      {
        heading: 'Uso permitido',
        items: [
          'Não tente acessar dados de outras contas nem burlar as regras de acesso.',
          'Não envie arquivos maliciosos nem automatize requisições em volume que atrapalhe o serviço.',
          'Não use o WoWHelp para violar os termos da Blizzard.',
        ],
      },
      {
        heading: 'Battle.net e dados da Blizzard',
        paragraphs: [
          'A conexão com a Battle.net segue os termos da Blizzard. Os dados do jogo pertencem à Blizzard e são mostrados com crédito. Se a Blizzard mudar ou encerrar o acesso, partes do WoWHelp podem deixar de funcionar.',
        ],
      },
      {
        heading: 'Addon WoWHelp Companion',
        paragraphs: [
          'O addon é gratuito, só lê informações que o próprio jogo mostra, não acessa a internet e não automatiza nenhuma ação. Você o instala e remove quando quiser.',
        ],
      },
      {
        heading: 'Informações mostradas',
        paragraphs: [
          'Fazemos o possível para mostrar dados certos e sempre dizemos a fonte e a data. Mesmo assim, informações do jogo mudam e podem estar desatualizadas; confira no jogo antes de decisões importantes.',
        ],
      },
      {
        heading: 'Disponibilidade e mudanças',
        paragraphs: [
          'Por ser versão de testes, o WoWHelp pode ficar fora do ar, mudar ou perder recursos. Podemos suspender contas que violem estes termos.',
        ],
      },
      {
        heading: 'Propriedade intelectual',
        paragraphs: [
          'A marca WoWHelp, o logo e as ilustrações (de Elianai dos Santos) pertencem ao projeto. Você continua dono do que escreve nos seus objetivos.',
        ],
      },
      {
        heading: 'Responsabilidade, lei e contato',
        paragraphs: [
          'Limites de responsabilidade, lei aplicável, foro e canal de contato serão definidos na revisão jurídica, respeitando o Código de Defesa do Consumidor.',
        ],
      },
    ],
  },
  'en-US': {
    title: 'Terms of use',
    draftNotice:
      'Draft under legal review. These terms have not been reviewed by a lawyer yet and may change before the public beta.',
    updated: 'Version of October 24, 2026',
    intro: 'By creating an account or using WoWHelp, you agree to these terms. Please also read the privacy policy.',
    sections: [
      {
        heading: 'What WoWHelp is',
        paragraphs: [
          'A free, fan-made tool to organize goals in World of Warcraft Retail. It is a test version. It is not affiliated with or endorsed by Blizzard Entertainment. World of Warcraft and Blizzard Entertainment are trademarks of Blizzard Entertainment, Inc.',
        ],
      },
      {
        heading: 'Your account',
        items: [
          'Use your own email and keep your password safe; you are responsible for what is done with your account.',
          'One person per account.',
          'You can delete your account at any time in Settings.',
        ],
      },
      {
        heading: 'Acceptable use',
        items: [
          "Do not try to access other accounts' data or get around access rules.",
          'Do not upload malicious files or automate requests in a volume that disrupts the service.',
          "Do not use WoWHelp to break Blizzard's terms.",
        ],
      },
      {
        heading: 'Battle.net and Blizzard data',
        paragraphs: [
          "The Battle.net connection follows Blizzard's terms. Game data belongs to Blizzard and is shown with credit. If Blizzard changes or ends access, parts of WoWHelp may stop working.",
        ],
      },
      {
        heading: 'WoWHelp Companion addon',
        paragraphs: [
          'The addon is free, only reads information the game itself shows, has no internet access and does not automate any action. You install and remove it whenever you want.',
        ],
      },
      {
        heading: 'Information shown',
        paragraphs: [
          'We do our best to show accurate data and always say where it comes from and when. Still, game information changes and may be out of date; check in game before important decisions.',
        ],
      },
      {
        heading: 'Availability and changes',
        paragraphs: [
          'As a test version, WoWHelp may go offline, change or lose features. We may suspend accounts that break these terms.',
        ],
      },
      {
        heading: 'Intellectual property',
        paragraphs: [
          'The WoWHelp name, logo and illustrations (by Elianai dos Santos) belong to the project. You keep ownership of what you write in your goals.',
        ],
      },
      {
        heading: 'Liability, law and contact',
        paragraphs: [
          'Limits of liability, governing law, venue and contact channel will be set during legal review, respecting the Brazilian Consumer Protection Code.',
        ],
      },
    ],
  },
};

export const LEGAL = { privacy, terms } as const;
export type LegalKind = keyof typeof LEGAL;
