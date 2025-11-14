import slugify from 'slugify';

class UploadAdapter {
  private loader: any;

  constructor(loader: any) {
    // The file loader instance to use during the upload.
    this.loader = loader;
  }

  // Starts the upload process.
  async upload() {
    const data = new FormData();

    const name = (await this.loader.file).name;

    data.append('file', await this.loader.file);
    data.append(
      'filename',
      slugify(name, {
        replacement: '-',
        remove: /\.,?!\+=\*:;/g,
        lower: true,
        strict: false,
        locale: 'ru',
        trim: true,
      })
    );

    return new Promise((resolve, reject) => {
      fetch(`http://localhost:3333/api/files/upload/image`, {
        method: 'POST',
        credentials: 'include',
        body: data,
      })
        .then(async (response) => {
          const result = await response.json();
          resolve({ default: `http://static.infomania.ru${result.path}` });
        })
        .catch((err) => {
          reject(err);
        });
    });
  }
}

export function uploadAdapter(editor: any) {
  editor.plugins.get('FileRepository').createUploadAdapter = (loader: any) => {
    return new UploadAdapter(loader);
  };
}
