# Ativar feedback no Corte

A interface está integrada no index.html. Mantém o alojamento atual no GitHub Pages.
Esta entrega ainda não foi publicada e não tem uma base de dados ligada.

1. Criar um projeto em https://supabase.com/dashboard (ou fornecer acesso a um projeto existente).
2. No SQL Editor desse projeto, executar o ficheiro feedback.sql uma vez.
3. Em feedback-config.js, preencher url com o endereço HTTPS do projeto e key com a chave pública publishable (ou anon). Nunca usar uma chave secret/service_role.
4. Publicar index.html, feedback.css, feedback-config.js e feedback.js no mesmo diretório do repositório original. Preservar img/ e media/.
5. Abrir o site em dois navegadores/dispositivos. Publicar um feedback no primeiro e carregar Atualizar no segundo. Confirmar leitura partilhada e os três filtros.

## Permissões e moderação

Os visitantes podem ler e criar feedback; não podem editar/apagar, nem escolher IDs ou datas. A moderação é feita pelo proprietário no Table Editor do Supabase, apagando entradas indesejadas. Não se recolhem emails. O texto é apresentado como texto, nunca como HTML.

Esta configuração aceita publicações anónimas: não inclui CAPTCHA nem limitação por IP. Para um lançamento com tráfego público, acrescentar uma função de servidor com validação CAPTCHA e limitação de envios antes de permitir inserções diretas. As permissões SQL não impedem spam automatizado.

## Verificação

Executar `node --test feedback.test.cjs` e `node --check feedback.js`. É ainda necessário testar com uma base de dados real e verificar visualmente em desktop e telemóvel. A nova secção tem texto em português; a tradução da secção para inglês fica pendente.

Documentação: https://supabase.com/docs/guides/database/postgres/row-level-security
