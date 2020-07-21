import { JSDOM } from 'jsdom';
export default content => new JSDOM(content).window.document;
