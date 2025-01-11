import fs from 'fs';
import path from 'path';
import problems from './problems.json';

fs.writeFileSync('output.txt', build());

function build() {
    const res = [];
    const submissions = dfs('/users/kevinhuang/downloads/submissions');

    for (const e of problems.problemsetQuestionList) {
        if (!submissions[e.titleSlug]) continue;
        const cur = submissions[e.titleSlug];
        const classRuntime = cur.timestamp_runtime < 1730437200 ? ' class="stale"' : '';
        const classMemory = cur.timestamp_memory < 1706767200 ? ' class="stale"' : '';

        const ele = [
            '<tr>',
            `    <td class="${e.difficulty.toLowerCase()}">${e.questionFrontendId}</td>`,
            `    <td><a href="/problems/${e.titleSlug}/">${e.title}</a></td>`,
            `    <td${classRuntime}><a href="${cur.url_runtime}">${cur.runtime}</a></td>`,
            `    <td${classMemory}><a href="${cur.url_memory}">${cur.memory}</a></td>`,
            `    <td>${cur.language}</td>`,
            '</tr>',
        ];

        res.push(ele.join`\n`);
    }

    return res.join`\n`;
}

function dfs(prev, set, res = {}) {
    set ??= new Set(['JavaScript', 'MySQL', 'Pandas', 'Java', 'Bash']);

    for (const e of fs.readdirSync(prev)) {
        const cur = path.join(prev, e);
        const flag = fs.statSync(cur).isDirectory();
        if (flag) dfs(cur, set, res);
        if (flag || e !== 'info.txt') continue;

        const data = JSON.parse(fs.readFileSync(cur));
        if (data.status_display !== 'Accepted') continue;
        if (!set.has(data.lang_name)) continue;

        const { title_slug, lang_name, url, timestamp } = data;
        const runtime = parseInt(data.runtime);
        const memory = parseFloat(data.memory);

        res[title_slug] ??= {
            runtime: Infinity,
            memory: Infinity,
            language: lang_name,
            url_runtime: null,
            url_memory: null,
            timestamp_runtime: 0,
            timestamp_memory: 0,
        };

        const obj = res[title_slug];

        if (runtime < obj.runtime) {
            obj.runtime = runtime, obj.url_runtime = url, obj.timestamp_runtime = timestamp;
        } else if (runtime === obj.runtime && timestamp > obj.timestamp_runtime) {
            obj.url_runtime = url, obj.timestamp_runtime = timestamp;
        }

        if (timestamp > 1706767200 && obj.timestamp_memory < 1706767200) {
            obj.memory = memory, obj.url_memory = url, obj.timestamp_memory = timestamp;
        } else if (memory < obj.memory && timestamp > 1706767200 && obj.timestamp_memory > 1706767200) {
            obj.memory = memory, obj.url_memory = url, obj.timestamp_memory = timestamp;
        } else if (memory < obj.memory && timestamp < 1706767200 && obj.timestamp_memory < 1706767200) {
            obj.memory = memory, obj.url_memory = url, obj.timestamp_memory = timestamp;
        } else if (memory === obj.memory && timestamp > obj.timestamp_memory) {
            obj.url_memory = url, obj.timestamp_memory = timestamp;
        }
    }

    return res;
}
