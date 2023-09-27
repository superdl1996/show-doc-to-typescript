const getDomById = (id) => {
  return document.querySelector('#' + id);
};

const getDate = () => {
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1; // 月份从0开始，需要加1
  const day = currentDate.getDate();
  const hours = currentDate.getHours();
  const minutes = currentDate.getMinutes();
  const seconds = currentDate.getSeconds();
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

const xlsxDialog = getDomById('xlsxDialog');
xlsxDialog.close();
console.log(123);
const handleXlsxGenerate = () => {
  const xlsxTextarea = getDomById('xlsxTextarea');
  const regex = /\_(\w)/g;

  const xlsxTextareaValue = xlsxTextarea.value.replace(regex, (...arg) => {
    return arg[1].toUpperCase();
  });
  const xlsxArray = getTsToArray(xlsxTextareaValue).filter((item) => !!item);
  let result = '';
  for (let index = 0; index < xlsxArray.length; index += 2) {
    result += xlsxArray[index] + ' ' + 'string' + ' ' + xlsxArray[index + 1] + '\n';
  }
  const showDocTextarea = getDomById('showDocTextarea');
  showDocTextarea.value = result;
  xlsxDialog.close();
};

const formatApi = ({ type, apiLink = '' }) => {
  // 以 列表 api-link为主生成各种主列表需要的变量
  const nameArray = apiLink.split('/');
  const nameLen = nameArray.length;
  const nameBefore = nameArray[nameLen - 2];
  const nameAfter = nameArray[nameLen - 1].split('.')[0];
  if (!nameBefore || !nameAfter) {
    alert('请填写' + type + '/showDoc上的api路径(整个路径复制)');
    throw new Error('请填写' + type + 'showDoc上的api路径(整个路径复制)');
    return;
  }

  // 截取api路径
  const parseApis = [...nameArray];
  if (parseApis[0].includes('{{')) {
    parseApis.shift();
  }

  const publicReturn = {
    // 接口名 驼峰
    apiName: nameBefore + nameAfter.slice(0, 1).toUpperCase() + nameAfter.slice(1),
    apiPath: '/' + parseApis.join('/'),
  };
  const listReturn = {
    ...publicReturn,
    // 当前选中
    currentState: [
      nameBefore + 'Current',
      'set' + nameBefore.slice(0, 1).toUpperCase() + nameBefore.slice(1) + 'Current',
    ],
    tsName:
      getDomById('resetTsName').value ||
      nameBefore.slice(0, 1).toUpperCase() + nameBefore.slice(1) + 'ListItem',
    persistenceKey: getDomById('tableName').value.toUpperCase(),
    author: getDomById('author').value,
  };
  return type === 'list' ? listReturn : publicReturn;
};

const handleGenerate = () => {
  const tableList = getDomById('tableList');
  const tableEdit = getDomById('tableEdit');
  const tableDel = getDomById('tableDel');
  const listData = formatApi({ type: 'list', apiLink: tableList.value });
  const editData = formatApi({ type: 'list', apiLink: tableEdit.value });
  const delData = formatApi({ type: 'list', apiLink: tableDel.value });

  const generateIndexProps = {
    apiListName: listData.apiName,
    apiEditName: editData.apiName,
    apiDelName: delData.apiName,
    currentState: listData.currentState,
    tsName: listData.tsName,
    persistenceKey: listData.persistenceKey,
  };
  generateIndex(generateIndexProps);
  const generateServicesProps = {
    ...listData,
    apiPathObj: {
      list: listData.apiPath,
      edit: editData.apiPath,
      del: delData.apiPath,
    },
    apiNameObj: {
      list: listData.apiName,
      edit: editData.apiName,
      del: delData.apiName,
    },
  };
  generateServices(generateServicesProps);
  generateTypings(listData);
  generateUseFormCloumns(listData);
  generateUseTableColumns(listData);

  getDomById('output').innerHTML = '';
  setCopyTextByBrotherId('output', '');
  getDomById('tabHeader').scrollIntoView({ behavior: 'smooth' });
};

const showDocTextarea = getDomById('showDocTextarea');
showDocTextarea.addEventListener('blur', (e) => {
  const tableList = getDomById('tableList');
  getDomById('output').innerHTML = generateTs();
  setCopyTextByBrotherId('output', generateTs());
});

//将showDoc textarea 内容转换为数组
const getTsToArray = (text) => {
  const regex = /\s/g;
  const text1 = text.replace(regex, '#');
  const text1Array = text1.split('#');
  return text1Array;
};

//根据 https://tooltt.com/json2typescript/ 校验ts类型
const getVerifyTs = () => {
  const json2typescriptTextarea = getDomById('json2typescriptTextarea');
  const verifyTsText = json2typescriptTextarea.value;
  const regex = /\s|{|}/g;
  const verifyTsText1 = verifyTsText.replace(regex, '');
  const verifyTsArray = verifyTsText1
    .slice(verifyTsText1.indexOf('RootObject') + 'RootObject'.length)
    .split(';');
  const copyTsArray = getTsToArray(getDomById('showDocTextarea').value);
  if (!verifyTsArray.length) return copyTsArray;
  const verifyTsArray1 = verifyTsArray.map((item) => {
    const itemToArray = item.split(':');
    return itemToArray;
  });
  copyTsArray.forEach((item, index) => {
    for (const [verifyIndex, verifyItem] of verifyTsArray1.entries()) {
      if (item === verifyItem[0]) {
        copyTsArray[index + 1] = verifyItem[1];
        return;
      }
    }
  });
  return copyTsArray;
};

const generateTs = (tsName = 'TypeName') => {
  const text1Array = getVerifyTs();
  let text4 = '';
  text1Array.forEach((item, index) => {
    if (['boolean', 'string', 'number'].includes(item)) {
      text4 += `${text1Array[index - 1]}: ${item}; // ${text1Array[index + 1]}\n`;
    }
  });
  text4 = `export type ${tsName} = {
    ${text4}}`;
  // const text1 = text.replace(regex, ":") + ":"
  // const regex1 = /(boolean:|string:|number:)/g;
  // const text2 = text1.replace(regex1, (match, capturedGroup) => {
  //   if (["boolean:", "string:", "number:"].includes(capturedGroup)) {
  //     return " " + capturedGroup.replace(":", "; //")
  //   }
  // })
  // const regex2 = /\/\/(.*?):/g
  // const text3 = text2.replace(regex2, (match, capturedGroup) => {
  //   return '// ' + capturedGroup + '\n'
  // })
  // const text4 =
  //   `export type ${tsName} = {
  //  ${text3}}`
  return text4;
};

const generateTstoCloumns = () => {
  const text1Array = getTsToArray(getDomById('showDocTextarea').value);
  const result = [];
  text1Array.forEach((item, index) => {
    if (['boolean', 'string', 'number'].includes(item)) {
      result.push({
        title: text1Array[index + 1],
        dataIndex: text1Array[index - 1],
      });
    }
  });
  return result;
};

const generateIndex = (props) => {
  const { apiListName, apiEditName, apiDelName, currentState, tsName, persistenceKey } = props;
  const html = `import { useRef, useState } from 'react';
      import type { BaseTableProps, TableActionType, TableToolbarDefine } from '@/components/BaseTable/typings';
      import { queryDictItemByClassCode } from '@/common/services/system';
      import ViewContainer from '@/components/ViewContainer';
      import BaseTable from '@/components/BaseTable';

      import type { ${tsName} } from './typings';
      import { ${apiListName}, ${apiEditName}, ${apiDelName} } from './services';
      import useTablecolumns from './useTableColumns';
      import useFormCloumns from './useFormCloumns';

      export default () => {
        const [${currentState[0]}, ${currentState[1]}] = useState<${tsName}>();
        const tableActionRef = useRef<TableActionType>();

        /** 表格刷新 */
        const tableReload = () => tableActionRef.current?.reload?.();

        /** 主单据弹窗操作 */
        const modalProps = { afterClose: tableReload };

        /** 列表请求 */
        const dataSourceRequest = async (params: FETCH.Req) => {
          return ${apiListName}({ ...params });
        };

        /** 新增/编辑 */
        const plusSubmit = async (params: FETCH.Req) => {
          return ${apiEditName}({ ...params });
        };

        const toolbar: TableToolbarDefine<${tsName}> = {
          plus: { columns: useFormCloumns(), onSubmit: plusSubmit },
          edit: { columns: useFormCloumns(), onSubmit: plusSubmit },
          deleted: { onSubmit: ${apiDelName} },
        };

        const generateTable: BaseTableProps<${tsName}> = {
          persistenceKey: '${persistenceKey}LISTTABLE',
          service: { dataSourceRequest },
          columns: useTablecolumns(),
          onActionCurrent: (${currentState[0]}) => ${currentState[1]}(${currentState[0]}),
          actionRef: tableActionRef,
          toolbar,
        };

        return (
          <ViewContainer>
            <BaseTable {...generateTable} />
          </ViewContainer>
        );
      };
    `;
  const index = getDomById('index');
  index.innerText = html;
  setCopyTextByBrotherId('index', html);
};

const generateServices = (props) => {
  const { author, tsName, apiPathObj, apiNameObj } = props;
  const html = `import { request } from 'umi';
  import type { ${tsName} } from './typings';
  import { getValueEnumsRequest } from '@/pages/common/services';

  /**
   * @Author: ${author}
   * @Date: ${getDate()}
   * @Description: 查询列表
   */
  export async function ${apiNameObj.list}(data?: FETCH.Req) {
    return request<FETCH.Res<${tsName}>>('${apiPathObj.list}', {
      method: 'POST',
      data,
    });
  }

  /**
   * @Author: ${author}
   * @Date: ${getDate()}
   * @Description: 新增或修改
   */
  export async function ${apiNameObj.edit}(data?: Partial<${tsName}>) {
    return request<FETCH.Row>('${apiPathObj.edit}', {
      method: 'POST',
      data,
    });
  }

  /**
   * @Author: ${author}
   * @Date: ${getDate()}
   * @Description: 删除
   */
  export async function ${apiNameObj.del}(data: FETCH.UpStatus) {
    return request<FETCH.Res>('${apiPathObj.del}', {
      method: 'POST',
      data,
    });
  }

  /**
 * @Author: DL
 * @Date: 2023-09-12 16:56:52
 * @Description: 数据字典
 */
  const valueEnumsRequestFn = getValueEnumsRequest([
    'BILL_STATUS',
    'PROJECT_TYPE',
    'PREPARE_METHOD',
    'CONSTRUCT_NATURE',
  ]);
  export async function valueEnumsRequest(key: keyof SYS.DictDefine) {
    return valueEnumsRequestFn(key);
  }
  `;
  const services = getDomById('services');
  services.innerText = html;
  setCopyTextByBrotherId('services', html);
};

const generateTypings = (props) => {
  const { tsName } = props;
  getDomById('typings').innerHTML = generateTs(tsName);
  setCopyTextByBrotherId('typings', generateTs(tsName));
};

const generateUseFormCloumns = (props) => {
  const { tsName } = props;
  const cloumnData = generateTstoCloumns();
  const cloumsArray = cloumnData.map(({ title, dataIndex }) => {
    return {
      title,
      dataIndex,
    };
  });
  cloumsArray.unshift({
    dataIndex: 'id',
    hideInForm: true,
  });
  const reg = /(},|\[)/g;
  const cloumsJson = JSON.stringify(cloumsArray).replace(reg, '$1\n').replace(']', '\n]');
  const html = `import { ProFormColumnsType } from '@ant-design/pro-form';
  import type { ${tsName} } from './typings';
  import { valueEnumsRequest } from './services';

  export default () => {
    const columns: ProFormColumnsType<${tsName}>[] = ${cloumsJson}
    return columns;
  }
  `;
  getDomById('useFormCloumns').innerText = html;
  setCopyTextByBrotherId('useFormCloumns', html);
};

const generateUseTableColumns = (props) => {
  const { tsName } = props;
  const cloumnData = generateTstoCloumns();
  const addDatas = [];
  const cloumsArray = cloumnData.map(({ title, dataIndex }) => {
    if (dataIndex.endsWith('Date') | dataIndex.endsWith('Datetime')) {
      addDatas.push({
        title,
        dataIndex,
        valueType: 'dateRange',
        hideInTable: true,
      });
    }
    return {
      title,
      dataIndex,
      search: false,
    };
  });
  addDatas.forEach((item) => {
    for (const [index, cloumItem] of cloumsArray.entries()) {
      if (item.title === cloumItem.title) {
        cloumsArray.splice(index + 1, 0, { ...item });
        return;
      }
    }
  });
  cloumsArray.unshift({
    dataIndex: 'index',
  });
  cloumsArray.push();
  const reg = /(},|\[)/g;
  const cloumsJson = JSON.stringify(cloumsArray)
    .replace(reg, '$1\n')
    .replace(']', `,{title: '操作',customRender () { },search: false}\n]`);

  const html = `import { TableColumnsDefine } from '@/components/BaseTable/typings';
  import type { ${tsName} } from './typings';
  import { valueEnumsRequest } from './services';

  export default () => {
    const columns: TableColumnsDefine<${tsName}> = ${cloumsJson}
    return columns
  }
  `;
  getDomById('useTableColumns').innerText = html;
  setCopyTextByBrotherId('useTableColumns', html);
};

const tabTitles = document.querySelectorAll('.tab-title');
const tabPanes = document.querySelectorAll('.tab-pane');
tabTitles.forEach((item, index) => {
  item.onclick = (e) => {
    const tabBarClassList = item.classList;
    removeClass(tabTitles, 'active');
    addClass(e.target, 'active');
    removeClass(tabPanes, 'show');
    addClass(tabPanes[index], 'show');
  };
});
const removeClass = (dom, className) => {
  dom.forEach((item) => {
    item.classList.remove(className);
  });
};
const addClass = (dom, className) => {
  dom.classList.add(className);
};

const handleCopy = async (copyText) => {
  try {
    await navigator.clipboard.writeText(copyText);
  } catch (err) {
    const inputElement = getDomById('copyInput');
    inputElement.value = copyText;
    inputElement.select();
    document.execCommand('copy');
    inputElement.value = '';
  }
};
const copyBtns = document.querySelectorAll('.copy-btn');
const copyToast = getDomById('copyToast');
copyBtns.forEach((item) => {
  item.addEventListener('click', async (e) => {
    const copyText = e.target.dataset.copyText;
    await handleCopy(copyText);
    copyToast.classList.add('show');
    setTimeout(() => {
      copyToast.classList.remove('show');
    }, 1000);
  });
});

const setCopyTextByBrotherId = (id, copyText) => {
  const element = getDomById(id);
  element.parentElement.querySelector('.copy-btn').dataset.copyText = copyText;
};
