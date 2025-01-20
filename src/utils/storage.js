const fs = require('fs').promises;
const path = require('path');

class StorageUtil {
  constructor() {
    this.dataDir = path.join(process.cwd(), 'data');
    this.coursesFile = path.join(this.dataDir, 'courses.json');
  }

  async init() {
    try {
      // 确保data目录存在
      await fs.mkdir(this.dataDir, { recursive: true });
    } catch (error) {
      console.error('创建数据目录失败:', error);
      throw error;
    }
  }

  async readExistingData() {
    try {
      const data = await fs.readFile(this.coursesFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        // 文件不存在，返回初始数据结构
        return {
          updateTime: new Date().toISOString(),
          total: 0,
          courses: {}
        };
      }
      throw error;
    }
  }

  async saveCourses(newCourses) {
    try {
      // 1. 读取现有数据
      let existingData = await this.readExistingData();
      let hasNewCourses = false;

      // 2. 遍历新数据
      for (const course of newCourses) {
        // 3. 检查是否存在
        if (!existingData.courses[course.pageId]) {
          // 4. 不存在则添加
          existingData.courses[course.pageId] = course;
          hasNewCourses = true;
          console.log(`添加新课程: ${course.title} (ID: ${course.pageId})`);
        }
      }

      if (hasNewCourses) {
        // 5. 更新元数据
        existingData.updateTime = new Date().toISOString();
        existingData.total = Object.keys(existingData.courses).length;

        // 6. 保存到文件
        await fs.writeFile(
          this.coursesFile,
          JSON.stringify(existingData, null, 2),
          'utf8'
        );
        console.log(`数据已更新，当前共有 ${existingData.total} 个课程`);
      } else {
        console.log('没有新课程需要添加');
      }

      return existingData;
    } catch (error) {
      console.error('保存课程数据失败:', error);
      throw error;
    }
  }

  async getAllCourses() {
    const data = await this.readExistingData();
    return Object.values(data.courses);
  }

  async getCourseById(pageId) {
    const data = await this.readExistingData();
    return data.courses[pageId];
  }
}

module.exports = new StorageUtil(); 