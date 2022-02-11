const escape = (str)=>{
    let ret = '';
    for (const c of str){
        if (c === '[' || c === ']' || c === '`') ret += '`';
        ret += c;
    }
    return ret;
};
const escapePrefix = (prefix)=>prefix === '' ? '' : escape(prefix) + ' '
;
const recur = (jevko, indent, prevIndent)=>{
    const { subjevkos , suffix  } = jevko;
    let ret = '';
    if (subjevkos.length > 0) {
        ret += '\n';
        for (const { prefix , jevko  } of subjevkos){
            ret += `${indent}${escapePrefix(prefix)}[${recur(jevko, indent + '  ', indent)}]\n`;
        }
        ret += prevIndent;
    }
    return ret + escape(suffix);
};
const trim3 = (prefix)=>{
    let i = 0, j = 0;
    for(; i < prefix.length; ++i){
        if (isWhitespace(prefix[i]) === false) break;
    }
    for(j = prefix.length - 1; j > i; --j){
        if (isWhitespace(prefix[j]) === false) break;
    }
    ++j;
    return [
        prefix.slice(0, i),
        prefix.slice(i, j),
        prefix.slice(j)
    ];
};
const isWhitespace = (c)=>{
    return ' \n\r\t'.includes(c);
};
const jevkoToString = (jevko)=>{
    const { subjevkos , suffix  } = jevko;
    let ret = '';
    for (const { prefix , jevko: jevko1  } of subjevkos){
        ret += `${escape(prefix)}[${jevkoToString(jevko1)}]`;
    }
    return ret + escape(suffix);
};
const jsonToSchema = (json)=>{
    if (typeof json === 'string') {
        return {
            type: 'string'
        };
    }
    if (typeof json === 'number') {
        return {
            type: 'float64'
        };
    }
    if (typeof json === 'boolean') {
        return {
            type: 'boolean'
        };
    }
    if (json === null) {
        return {
            type: 'null'
        };
    }
    if (Array.isArray(json)) {
        const itemSchemas = [];
        for (const val of json){
            itemSchemas.push(jsonToSchema(val));
        }
        return {
            type: 'tuple',
            itemSchemas
        };
    }
    const entries = Object.entries(json);
    let props = Object.create(null);
    for (const [key, val] of entries){
        props[key] = jsonToSchema(val);
    }
    return {
        type: 'object',
        props
    };
};
const jsonToJevko = (json)=>{
    if ([
        'string',
        'boolean',
        'number'
    ].includes(typeof json)) return {
        subjevkos: [],
        suffix: json.toString()
    };
    if (json === null) return {
        subjevkos: [],
        suffix: ''
    };
    if (Array.isArray(json)) {
        return {
            subjevkos: json.map((v)=>({
                    prefix: '',
                    jevko: jsonToJevko(v)
                })
            ),
            suffix: ''
        };
    }
    const entries = Object.entries(json);
    return {
        suffix: '',
        subjevkos: entries.map(([k, v])=>({
                prefix: k,
                jevko: jsonToJevko(v)
            })
        )
    };
};
const interJevkoToSchema = (jevko)=>{
    const { subjevkos , suffix  } = jevko;
    const trimmed = suffix.trim();
    if (subjevkos.length === 0) {
        if ([
            'true',
            'false'
        ].includes(trimmed)) return {
            type: 'boolean'
        };
        if (trimmed === 'null') return {
            type: 'null'
        };
        if (trimmed === 'NaN') return {
            type: 'float64'
        };
        if (trimmed === '') return {
            type: 'string'
        };
        const num = Number(trimmed);
        if (Number.isNaN(num)) return {
            type: 'string'
        };
        return {
            type: 'float64'
        };
    }
    if (trimmed !== '') throw Error('suffix must be blank');
    const { prefix  } = subjevkos[0];
    if (prefix.trim() === '') {
        const itemSchemas = [];
        for (const { prefix , jevko  } of subjevkos){
            if (prefix.trim() !== '') throw Error('bad tuple/array');
            itemSchemas.push(interJevkoToSchema(jevko));
        }
        return {
            type: 'tuple',
            itemSchemas
        };
    }
    const props = Object.create(null);
    for (const { prefix: prefix1 , jevko: jevko1  } of subjevkos){
        const key = prefix1.trim();
        if (key in props) throw Error(`duplicate key (${key})`);
        props[key] = interJevkoToSchema(jevko1);
    }
    return {
        type: 'object',
        props
    };
};
const mod = {
    jsonToSchema: jsonToSchema,
    interJevkoToSchema: interJevkoToSchema
};
const sjevkoToSchema = (jevko)=>{
    const { subjevkos , suffix  } = jevko;
    const type = suffix.trim();
    if ([
        'string',
        'float64',
        'boolean',
        'empty',
        'null'
    ].includes(type)) {
        if (subjevkos.length > 0) throw Error('subs > 0 in primitive type');
        return {
            type
        };
    }
    if (type === 'array') return toArray(jevko);
    if (type === 'tuple') return toTuple(jevko);
    if (type === 'first match') return toFirstMatch(jevko);
    if (type === 'object') return toObject(jevko);
    throw Error(`Unknown type (${type})`);
};
const toArray = (jevko)=>{
    const { subjevkos , suffix  } = jevko;
    if (subjevkos.length !== 1) throw Error('subs !== 1 in array');
    const { prefix , jevko: j  } = subjevkos[0];
    if (prefix.trim() !== '') throw Error('empty prefix expected');
    return {
        type: 'array',
        itemSchema: sjevkoToSchema(j)
    };
};
const toTuple = (jevko)=>{
    const { subjevkos , suffix  } = jevko;
    const itemSchemas = [];
    for (const { prefix , jevko: jevko1  } of subjevkos){
        if (prefix.trim() !== '') throw Error('empty prefix expected');
        itemSchemas.push(sjevkoToSchema(jevko1));
    }
    return {
        type: 'tuple',
        itemSchemas
    };
};
const toFirstMatch = (jevko)=>{
    const { subjevkos , suffix  } = jevko;
    const alternatives = [];
    for (const { prefix , jevko: jevko2  } of subjevkos){
        if (prefix.trim() !== '') throw Error('empty prefix expected');
        alternatives.push(sjevkoToSchema(jevko2));
    }
    return {
        type: 'first match',
        alternatives
    };
};
const toObject = (jevko)=>{
    const { subjevkos , suffix  } = jevko;
    const props = Object.create(null);
    for (const { prefix , jevko: jevko3  } of subjevkos){
        const [pre, mid, post] = trim3(prefix);
        if (mid === '') throw Error('empty key');
        if (mid.startsWith('-')) continue;
        const key = mid.startsWith('|') ? mid.slice(1) + post : mid;
        if (key in props) throw Error('duplicate key');
        props[key] = sjevkoToSchema(jevko3);
    }
    return {
        type: 'object',
        props
    };
};
const schemaToSjevko = (schema)=>{
    const { type  } = schema;
    if ([
        'string',
        'float64',
        'boolean',
        'empty',
        'null'
    ].includes(type)) {
        return {
            suffix: type,
            subjevkos: []
        };
    }
    if (type === 'array') return toArray1(schema);
    if (type === 'tuple') return toTuple1(schema);
    if (type === 'object') return toObject1(schema);
    if (type === 'first match') return toFirstMatch1(schema);
    throw Error(`Unknown schema type ${type}`);
};
const toArray1 = (schema)=>{
    const { itemSchema  } = schema;
    return {
        suffix: 'array',
        subjevkos: [
            {
                prefix: '',
                jevko: schemaToSjevko(itemSchema)
            }
        ]
    };
};
const toTuple1 = (schema)=>{
    const { itemSchemas , isSealed  } = schema;
    return {
        suffix: 'tuple',
        subjevkos: itemSchemas.map((s)=>({
                prefix: '',
                jevko: schemaToSjevko(s)
            })
        )
    };
};
const toObject1 = (schema)=>{
    const { props , isSealed  } = schema;
    return {
        suffix: 'object',
        subjevkos: Object.entries(props).map(([k, v])=>{
            let prefix = '';
            if (k === '') prefix = '|';
            else {
                const [pre, mid, post] = trim3(k);
                if (pre !== '') prefix += '|' + pre;
                prefix += mid;
                if (post !== '') prefix += post + '|';
            }
            return {
                prefix,
                jevko: schemaToSjevko(v)
            };
        })
    };
};
const toFirstMatch1 = (schema)=>{
    const { alternatives  } = schema;
    return {
        suffix: 'first match',
        subjevkos: alternatives.map((s)=>({
                prefix: '',
                jevko: schemaToSjevko(s)
            })
        )
    };
};
export { sjevkoToSchema as sjevkoToSchema };
export { schemaToSjevko as schemaToSjevko };
export { mod as schemainfer };
