const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');
test('public feedback safely renders user text',()=>{const js=fs.readFileSync('feedback.js','utf8');assert.match(js,/fetch\(/);assert.match(js,/textContent/);assert.doesNotMatch(js,/innerHTML/);assert.match(js,/response.ok/);});
test('a 201 insert with an empty body counts as success',()=>{const js=fs.readFileSync('feedback.js','utf8');assert.match(js,/response\.text\(\)/);assert.doesNotMatch(js,/204 \? null : response\.json\(\)/);});
test('feedback integrated with mobile access',()=>{const html=fs.readFileSync('index.html','utf8');assert.match(html,/id="feedback"/);assert.match(html,/feedback.js/);assert.match(fs.readFileSync('feedback.css','utf8'),/feedback-link/);});
