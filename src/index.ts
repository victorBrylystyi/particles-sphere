//@ts-nocheck
import '../css/index.css';
import { App } from './App';

const isDev = process.env.NODE_ENV == "development";
const isProd = process.env.NODE_ENV == "production";

if (isDev) {
    const app = new App({});
} else if (isProd) {
    global.Effect = App;
}